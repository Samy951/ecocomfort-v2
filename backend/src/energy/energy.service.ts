import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyMetric } from '../shared/entities/energy-metric.entity';
import { DoorState } from '../shared/entities/door-state.entity';
import { RuuviParser } from '../sensors/ruuvi.parser';
import { WeatherService } from './weather.service';
import { ConfigurationService } from '../shared/config/configuration.service';
import { EcoWebSocketGateway } from '../websocket/websocket.gateway';

export interface EnergyCalculationInput {
  doorStateId: number;
  durationSeconds: number;
  timestamp: Date;
}

export interface EnergyCalculationResult {
  energyLossWatts: number;
  costEuros: number;
  co2EmissionsGrams: number;
  deltaT: number;
  indoorTemp: number;
  outdoorTemp: number;
}

export interface EnergyMetricEvent {
  doorStateId: number;
  energyLossWatts: number;
  costEuros: number;
  co2EmissionsGrams: number;
  timestamp: Date;
}

@Injectable()
export class EnergyService {
  private readonly logger = new Logger(EnergyService.name);

  constructor(
    @InjectRepository(EnergyMetric)
    private energyMetricRepository: Repository<EnergyMetric>,
    @InjectRepository(DoorState)
    private doorStateRepository: Repository<DoorState>,
    private ruuviParser: RuuviParser,
    private weatherService: WeatherService,
    private configService: ConfigurationService,
    private webSocketGateway: EcoWebSocketGateway,
  ) {}

  async calculateEnergyLoss(input: EnergyCalculationInput): Promise<void> {
    try {
      // Get indoor temperature from RuuviTag sensors
      const indoorTemp = this.ruuviParser.getAverageIndoorTemperature();
      if (indoorTemp === null) {
        this.logger.error(`Cannot calculate energy loss for doorStateId ${input.doorStateId}: No indoor temperature data available`);
        return;
      }

      // Get outdoor temperature from OpenWeather
      const weatherData = await this.weatherService.getOutdoorTemperature();
      if (!weatherData) {
        this.logger.error(`Cannot calculate energy loss for doorStateId ${input.doorStateId}: No outdoor temperature data available`);
        return;
      }

      const outdoorTemp = weatherData.temperature;

      if (weatherData.source === 'cache') {
        this.logger.log(`Using cached outdoor temperature: ${outdoorTemp}°C`);
      }

      // Verify doorState exists
      const doorState = await this.doorStateRepository.findOne({
        where: { id: input.doorStateId }
      });

      if (!doorState) {
        this.logger.error(`Cannot calculate energy loss: DoorState with id ${input.doorStateId} not found`);
        return;
      }

      // Calculate energy metrics
      const result = this.performEnergyCalculation({
        indoorTemp,
        outdoorTemp,
        durationSeconds: input.durationSeconds,
      });

      // Save to database
      const energyMetric = this.energyMetricRepository.create({
        doorStateId: input.doorStateId,
        energyLossWatts: result.energyLossWatts,
        costEuros: result.costEuros,
        co2EmissionsGrams: result.co2EmissionsGrams,
        indoorTemp: result.indoorTemp,
        outdoorTemp: result.outdoorTemp,
        deltaT: result.deltaT,
        durationSeconds: input.durationSeconds,
        timestamp: input.timestamp,
      });

      await this.energyMetricRepository.save(energyMetric);

      this.logger.log(
        `Energy calculated for doorStateId ${input.doorStateId}: ` +
        `${result.energyLossWatts}W, €${result.costEuros}, ${result.co2EmissionsGrams}g CO2`
      );

      // Emit WebSocket event
      const event: EnergyMetricEvent = {
        doorStateId: input.doorStateId,
        energyLossWatts: result.energyLossWatts,
        costEuros: result.costEuros,
        co2EmissionsGrams: result.co2EmissionsGrams,
        timestamp: input.timestamp,
      };

      this.webSocketGateway.emit('energy_metric_created', event);

    } catch (error) {
      this.logger.error(`Failed to calculate energy loss for doorStateId ${input.doorStateId}: ${error.message}`);
    }
  }

  private performEnergyCalculation(params: {
    indoorTemp: number;
    outdoorTemp: number;
    durationSeconds: number;
  }): EnergyCalculationResult {
    const { indoorTemp, outdoorTemp, durationSeconds } = params;
    const config = this.configService.energy;

    // Calculate temperature difference
    const deltaT = Math.round((indoorTemp - outdoorTemp) * 100) / 100;

    // Energy formula: Watts = ΔT × Surface × U × (duration/3600)
    const energyLossWatts = Math.round(
      deltaT * config.doorSurfaceM2 * config.thermalCoefficientU * (durationSeconds / 3600) * 100
    ) / 100;

    // Convert to kWh for cost and CO2 calculations
    const energyLossKwh = energyLossWatts / 1000;

    // Cost calculation
    const costEuros = Math.round(energyLossKwh * config.energyCostPerKwh * 10000) / 10000;

    // CO2 emissions calculation
    const co2EmissionsGrams = Math.round(energyLossKwh * config.co2EmissionsPerKwh * 100) / 100;

    return {
      energyLossWatts,
      costEuros,
      co2EmissionsGrams,
      deltaT,
      indoorTemp: Math.round(indoorTemp * 100) / 100,
      outdoorTemp: Math.round(outdoorTemp * 100) / 100,
    };
  }
}