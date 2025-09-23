import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoorState } from '../shared/entities/door-state.entity';
import { MqttService } from '../mqtt/mqtt.service';
import { ConfigurationService } from '../shared/config/configuration.service';
import { EnergyService } from '../energy/energy.service';
import { EcoWebSocketGateway } from '../websocket/websocket.gateway';
import { GamificationService } from '../gamification/gamification.service';

interface DoorCurrentState {
  isOpen: boolean;
  openedAt?: Date;
  lastDoorStateId?: number;
}

@Injectable()
export class DoorService implements OnModuleInit {
  private readonly logger = new Logger(DoorService.name);
  private currentState: DoorCurrentState = { isOpen: false };

  get currentDoorState(): DoorCurrentState {
    return this.currentState;
  }

  constructor(
    @InjectRepository(DoorState)
    private doorStateRepository: Repository<DoorState>,
    private mqttService: MqttService,
    private configService: ConfigurationService,
    private energyService: EnergyService,
    private webSocketGateway: EcoWebSocketGateway,
    @Inject(forwardRef(() => GamificationService))
    private gamificationService: GamificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    const doorTopic = this.configService.mqtt.doorTopic;
    this.mqttService.onMessage(doorTopic, this.handleDoorMessage.bind(this));
    this.logger.log(`Subscribed to door sensor topic: ${doorTopic}`);
  }

  private handleDoorMessage(topic: string, payload: Buffer): void {
    try {
      const message = JSON.parse(payload.toString());

      if (!message.Switch1 || !message.Switch1.Action) {
        this.logger.warn('Invalid door message structure, ignoring');
        return;
      }

      const action = message.Switch1.Action;
      const isOpen = action === 'OFF'; // OFF = open, ON = closed

      this.processDoorStateChange(isOpen);
    } catch (error) {
      this.logger.warn(`Failed to parse door message: ${error.message}`);
    }
  }

  private async processDoorStateChange(isOpen: boolean): Promise<void> {
    if (this.currentState.isOpen === isOpen) {
      return;
    }

    const now = new Date();

    try {
      if (isOpen) {
        await this.handleDoorOpening(now);
      } else {
        await this.handleDoorClosing(now);
      }

      this.logger.log(`Door state changed to: ${isOpen ? 'OPEN' : 'CLOSED'}`);

      // Emit WebSocket event after successful database update
      this.webSocketGateway.emitDoorStateChanged(isOpen);
    } catch (error) {
      this.logger.error(`Failed to process door state change: ${error.message}`);
    }
  }

  private async handleDoorOpening(timestamp: Date): Promise<void> {
    const doorState = this.doorStateRepository.create({
      isOpen: true,
      timestamp,
    });

    const savedState = await this.doorStateRepository.save(doorState);

    this.currentState = {
      isOpen: true,
      openedAt: timestamp,
      lastDoorStateId: savedState.id,
    };
  }

  private async handleDoorClosing(timestamp: Date): Promise<void> {
    if (this.currentState.openedAt && this.currentState.lastDoorStateId) {
      await this.calculateAndUpdateDuration(timestamp);
    }

    const doorState = this.doorStateRepository.create({
      isOpen: false,
      timestamp,
    });

    await this.doorStateRepository.save(doorState);

    this.currentState = {
      isOpen: false,
      openedAt: undefined,
      lastDoorStateId: undefined,
    };
  }

  private async calculateAndUpdateDuration(closedAt: Date): Promise<void> {
    if (!this.currentState.openedAt || !this.currentState.lastDoorStateId) {
      return;
    }

    const durationMs = closedAt.getTime() - this.currentState.openedAt.getTime();
    const durationSeconds = Math.floor(durationMs / 1000);

    await this.doorStateRepository.update(
      this.currentState.lastDoorStateId,
      { durationSeconds }
    );

    this.logger.log(`Door was open for ${durationSeconds} seconds`);

    // Trigger energy calculation
    await this.energyService.calculateEnergyLoss({
      doorStateId: this.currentState.lastDoorStateId,
      durationSeconds,
      timestamp: closedAt,
    });

    // Trigger gamification check (assume userId = 1 for mono-user app)
    await this.gamificationService.handleDoorClosed(1, durationSeconds);
  }

  // Method for testing door state without MQTT
  async simulateDoorStateChange(isOpen: boolean): Promise<void> {
    this.logger.log(`[TEST] Simulating door state change to: ${isOpen ? 'OPEN' : 'CLOSED'}`);
    await this.processDoorStateChange(isOpen);
  }
}