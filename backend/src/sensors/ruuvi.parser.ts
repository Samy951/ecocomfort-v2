import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensorReading } from '../shared/entities/sensor-reading.entity';
import { MqttService } from '../mqtt/mqtt.service';
import { ConfigurationService } from '../shared/config/configuration.service';
import { EcoWebSocketGateway } from '../websocket/websocket.gateway';

interface SensorState {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  lastUpdate: Date;
}

@Injectable()
export class RuuviParser implements OnModuleInit {
  private readonly logger = new Logger(RuuviParser.name);
  private sensorStates = new Map<string, SensorState>();
  private lastEmissionTime = 0;

  private readonly VALID_SENSORS = ['944372022', '422801533', '1947698524'];
  private readonly DATA_TYPE_MAP = {
    '112': 'temperature',
    '114': 'humidity',
    '116': 'pressure'
  };
  private readonly DATA_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  private readonly EMISSION_THROTTLE_MS = 60 * 1000; // 1 minute
  private readonly TEMP_THRESHOLD = 0.5; // 0.5°C
  private readonly HUMIDITY_THRESHOLD = 2; // 2%

  constructor(
    @InjectRepository(SensorReading)
    private sensorReadingRepository: Repository<SensorReading>,
    private mqttService: MqttService,
    private configService: ConfigurationService,
    private webSocketGateway: EcoWebSocketGateway,
  ) {}

  async onModuleInit(): Promise<void> {
    const ruuviTopic = this.configService.mqtt.ruuviTopic;
    this.mqttService.onMessage(ruuviTopic, this.handleRuuviMessage.bind(this));
    this.logger.log(`Subscribed to RuuviTag topic: ${ruuviTopic}`);
  }

  private handleRuuviMessage(topic: string, payload: Buffer): void {
    try {
      const topicRegex = /pws-packet\/202481601481463\/(\d+)\/(\d+)/;
      const match = topic.match(topicRegex);

      if (!match) {
        this.logger.warn(`Invalid topic format: ${topic}`);
        return;
      }

      const [, sensorId, dataType] = match;

      if (!this.VALID_SENSORS.includes(sensorId)) {
        this.logger.warn(`Unknown sensor ID: ${sensorId}`);
        return;
      }

      const measureType = this.DATA_TYPE_MAP[dataType];
      if (!measureType) {
        return; // Ignore unsupported data types (127, 142)
      }

      const message = JSON.parse(payload.toString());
      const value = message.data?.[measureType];

      if (value === undefined) {
        this.logger.warn(`Missing ${measureType} value in payload`);
        return;
      }

      this.updateSensorCache(sensorId, measureType, value);
      this.saveSensorReading(sensorId);
      this.tryEmitSensorDataUpdate();

      this.logger.log(`Sensor ${sensorId}: ${measureType}=${value}${this.getUnit(measureType)}`);

    } catch (error) {
      this.logger.error(`Failed to parse message: ${error.message}`);
    }
  }

  private updateSensorCache(sensorId: string, measureType: string, value: number): void {
    const currentState = this.sensorStates.get(sensorId) || {
      lastUpdate: new Date()
    };

    currentState[measureType] = value;
    currentState.lastUpdate = new Date();

    this.sensorStates.set(sensorId, currentState);
  }

  private async saveSensorReading(sensorId: string): Promise<void> {
    try {
      const state = this.sensorStates.get(sensorId);
      if (!state) return;

      const sensorReading = this.sensorReadingRepository.create({
        sensorId,
        temperature: state.temperature ?? null,
        humidity: state.humidity ?? null,
        pressure: state.pressure ?? null,
        timestamp: new Date()
      });

      await this.sensorReadingRepository.save(sensorReading);
    } catch (error) {
      this.logger.error(`Failed to save sensor reading: ${error.message}`);
    }
  }

  public getAverageIndoorTemperature(): number | null {
    const temperatures: number[] = [];
    const now = Date.now();

    for (const [sensorId, state] of this.sensorStates) {
      if (state.temperature !== undefined &&
          (now - state.lastUpdate.getTime()) < this.DATA_TIMEOUT_MS) {
        temperatures.push(state.temperature);
      }
    }

    if (temperatures.length === 0) {
      this.logger.warn('No recent temperature data available for average calculation');
      return null;
    }

    const average = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    const roundedAverage = Math.round(average * 100) / 100;

    this.logger.log(`Average indoor temperature: ${roundedAverage}°C (${temperatures.length} sensors active)`);
    return roundedAverage;
  }

  private tryEmitSensorDataUpdate(): void {
    const now = Date.now();

    // Check throttling
    if (now - this.lastEmissionTime < this.EMISSION_THROTTLE_MS) {
      return;
    }

    const avgTemp = this.getAverageIndoorTemperature();
    const avgHumidity = this.getAverageIndoorHumidity();

    if (avgTemp === null || avgHumidity === null) {
      return;
    }

    // Check if change is significant (simplified - in real implementation,
    // you'd store previous values to compare)
    this.lastEmissionTime = now;
    this.webSocketGateway.emitSensorDataUpdated(avgTemp, avgHumidity);
  }

  public getAverageIndoorHumidity(): number | null {
    const humidities: number[] = [];
    const now = Date.now();

    for (const [sensorId, state] of this.sensorStates) {
      if (state.humidity !== undefined &&
          (now - state.lastUpdate.getTime()) < this.DATA_TIMEOUT_MS) {
        humidities.push(state.humidity);
      }
    }

    if (humidities.length === 0) {
      this.logger.warn('No recent humidity data available for average calculation');
      return null;
    }

    const average = humidities.reduce((sum, humidity) => sum + humidity, 0) / humidities.length;
    const roundedAverage = Math.round(average * 100) / 100;

    this.logger.log(`Average indoor humidity: ${roundedAverage}% (${humidities.length} sensors active)`);
    return roundedAverage;
  }

  private getUnit(measureType: string): string {
    switch (measureType) {
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'pressure': return 'hPa';
      default: return '';
    }
  }
}