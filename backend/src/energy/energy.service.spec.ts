import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyService, EnergyCalculationInput } from './energy.service';
import { EnergyMetric } from '../shared/entities/energy-metric.entity';
import { DoorState } from '../shared/entities/door-state.entity';
import { RuuviParser } from '../sensors/ruuvi.parser';
import { WeatherService, WeatherData } from './weather.service';
import { ConfigurationService } from '../shared/config/configuration.service';
import { EcoWebSocketGateway } from '../websocket/websocket.gateway';
import { mockService } from '../shared/testing/mockers';

describe('EnergyService', () => {
  let service: EnergyService;
  let energyMetricRepository: jest.Mocked<Repository<EnergyMetric>>;
  let doorStateRepository: jest.Mocked<Repository<DoorState>>;
  let ruuviParser: jest.Mocked<RuuviParser>;
  let weatherService: jest.Mocked<WeatherService>;
  let configService: jest.Mocked<ConfigurationService>;
  let webSocketGateway: jest.Mocked<EcoWebSocketGateway>;

  const mockConfig = {
    doorSurfaceM2: 2.0,
    thermalCoefficientU: 3.5,
    energyCostPerKwh: 0.174,
    co2EmissionsPerKwh: 56,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnergyService,
        mockService(getRepositoryToken(EnergyMetric), {
          create: jest.fn(),
          save: jest.fn(),
        }),
        mockService(getRepositoryToken(DoorState), {
          findOne: jest.fn(),
        }),
        mockService(RuuviParser, {
          getAverageIndoorTemperature: jest.fn(),
        }),
        mockService(WeatherService, {
          getOutdoorTemperature: jest.fn(),
        }),
        mockService(ConfigurationService, {
          energy: mockConfig,
        }),
        mockService(EcoWebSocketGateway, {
          emit: jest.fn(),
        }),
      ],
    }).compile();

    service = module.get<EnergyService>(EnergyService);
    energyMetricRepository = module.get(getRepositoryToken(EnergyMetric));
    doorStateRepository = module.get(getRepositoryToken(DoorState));
    ruuviParser = module.get(RuuviParser);
    weatherService = module.get(WeatherService);
    configService = module.get(ConfigurationService);
    webSocketGateway = module.get(EcoWebSocketGateway);
  });

  describe('calculateEnergyLoss', () => {
    const validInput: EnergyCalculationInput = {
      doorStateId: 1,
      durationSeconds: 60,
      timestamp: new Date('2024-01-20T14:30:00.000Z'),
    };

    const mockDoorState = {
      id: 1,
      isOpen: true,
      timestamp: new Date('2024-01-20T14:29:00.000Z'),
    } as DoorState;

    const mockWeatherData: WeatherData = {
      temperature: 5.75,
      source: 'api' as const,
      timestamp: new Date('2024-01-20T14:30:00.000Z'),
    };

    const mockEnergyMetric = {
      id: 1,
      doorStateId: 1,
      energyLossWatts: 1.81,
      costEuros: 0.0003,
      co2EmissionsGrams: 0.1,
      indoorTemp: 21.25,
      outdoorTemp: 5.75,
      deltaT: 15.5,
      durationSeconds: 60,
      timestamp: new Date('2024-01-20T14:30:00.000Z'),
    } as EnergyMetric;

    beforeEach(() => {
      ruuviParser.getAverageIndoorTemperature.mockReturnValue(21.25);
      weatherService.getOutdoorTemperature.mockResolvedValue(mockWeatherData);
      doorStateRepository.findOne.mockResolvedValue(mockDoorState);
      energyMetricRepository.create.mockReturnValue(mockEnergyMetric);
      energyMetricRepository.save.mockResolvedValue(mockEnergyMetric);
    });

    it('should calculate energy loss successfully with all data available', async () => {
      await service.calculateEnergyLoss(validInput);

      // Verify energy metric creation
      expect(energyMetricRepository.create).toHaveBeenCalledWith({
        doorStateId: 1,
        energyLossWatts: 1.81,
        costEuros: 0.0003,
        co2EmissionsGrams: 0.1,
        indoorTemp: 21.25,
        outdoorTemp: 5.75,
        deltaT: 15.5,
        durationSeconds: 60,
        timestamp: validInput.timestamp,
      });

      // Verify database save
      expect(energyMetricRepository.save).toHaveBeenCalledWith(mockEnergyMetric);

      // Verify WebSocket emission
      expect(webSocketGateway.emit).toHaveBeenCalledWith('energy_metric_created', {
        doorStateId: 1,
        energyLossWatts: 1.81,
        costEuros: 0.0003,
        co2EmissionsGrams: 0.1,
        timestamp: validInput.timestamp,
      });
    });

    it('should not calculate when no indoor temperature data available', async () => {
      ruuviParser.getAverageIndoorTemperature.mockReturnValue(null);

      await service.calculateEnergyLoss(validInput);

      expect(energyMetricRepository.create).not.toHaveBeenCalled();
      expect(energyMetricRepository.save).not.toHaveBeenCalled();
      expect(webSocketGateway.emit).not.toHaveBeenCalled();
    });

    it('should not calculate when no outdoor temperature data available', async () => {
      weatherService.getOutdoorTemperature.mockResolvedValue(null);

      await service.calculateEnergyLoss(validInput);

      expect(energyMetricRepository.create).not.toHaveBeenCalled();
      expect(energyMetricRepository.save).not.toHaveBeenCalled();
      expect(webSocketGateway.emit).not.toHaveBeenCalled();
    });

    it('should not calculate when door state not found', async () => {
      doorStateRepository.findOne.mockResolvedValue(null);

      await service.calculateEnergyLoss(validInput);

      expect(energyMetricRepository.create).not.toHaveBeenCalled();
      expect(energyMetricRepository.save).not.toHaveBeenCalled();
      expect(webSocketGateway.emit).not.toHaveBeenCalled();
    });

    it('should use cached weather data without logging error', async () => {
      const cachedWeatherData: WeatherData = {
        ...mockWeatherData,
        source: 'cache' as const,
      };
      weatherService.getOutdoorTemperature.mockResolvedValue(cachedWeatherData);

      await service.calculateEnergyLoss(validInput);

      expect(energyMetricRepository.create).toHaveBeenCalled();
      expect(energyMetricRepository.save).toHaveBeenCalled();
      expect(webSocketGateway.emit).toHaveBeenCalled();
    });

    it('should handle database save errors gracefully', async () => {
      energyMetricRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.calculateEnergyLoss(validInput)).resolves.not.toThrow();

      expect(energyMetricRepository.create).toHaveBeenCalled();
      expect(webSocketGateway.emit).not.toHaveBeenCalled();
    });

    it('should handle WebSocket emission errors gracefully', async () => {
      webSocketGateway.emit.mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      await expect(service.calculateEnergyLoss(validInput)).resolves.not.toThrow();

      expect(energyMetricRepository.save).toHaveBeenCalled();
    });
  });

  describe('energy calculation precision', () => {
    it('should calculate energy with correct precision for various scenarios', () => {
      const testCases = [
        {
          name: 'short opening',
          indoorTemp: 20.0,
          outdoorTemp: 10.0,
          durationSeconds: 30,
          expected: {
            energyLossWatts: 0.58,
            costEuros: 0.0001,
            co2EmissionsGrams: 0.03,
            deltaT: 10.0,
          },
        },
        {
          name: 'long opening',
          indoorTemp: 22.5,
          outdoorTemp: 0.0,
          durationSeconds: 300,
          expected: {
            energyLossWatts: 13.13,
            costEuros: 0.0023,
            co2EmissionsGrams: 0.74,
            deltaT: 22.5,
          },
        },
        {
          name: 'negative temperature difference',
          indoorTemp: 15.0,
          outdoorTemp: 25.0,
          durationSeconds: 120,
          expected: {
            energyLossWatts: -2.33,
            costEuros: -0.0004,
            co2EmissionsGrams: -0.13,
            deltaT: -10.0,
          },
        },
        {
          name: 'very small temperature difference',
          indoorTemp: 20.12,
          outdoorTemp: 20.11,
          durationSeconds: 60,
          expected: {
            energyLossWatts: 0.0,
            costEuros: 0.0,
            co2EmissionsGrams: 0.0,
            deltaT: 0.01,
          },
        },
      ];

      testCases.forEach(({ name, indoorTemp, outdoorTemp, durationSeconds, expected }) => {
        const result = (service as any).performEnergyCalculation({
          indoorTemp,
          outdoorTemp,
          durationSeconds,
        });

        expect(result.energyLossWatts).toBe(expected.energyLossWatts);
        expect(result.costEuros).toBe(expected.costEuros);
        expect(result.co2EmissionsGrams).toBe(expected.co2EmissionsGrams);
        expect(result.deltaT).toBe(expected.deltaT);
        expect(result.indoorTemp).toBe(Math.round(indoorTemp * 100) / 100);
        expect(result.outdoorTemp).toBe(Math.round(outdoorTemp * 100) / 100);
      });
    });

    it('should apply correct rounding precision', () => {
      // Test with values that require specific rounding
      const result = (service as any).performEnergyCalculation({
        indoorTemp: 21.256789,
        outdoorTemp: 5.754321,
        durationSeconds: 75,
      });

      // Energy and CO2: 2 decimal places
      expect(result.energyLossWatts.toString()).toMatch(/^\d+\.\d{2}$/);
      expect(result.co2EmissionsGrams.toString()).toMatch(/^\d+\.\d{2}$/);

      // Cost: 4 decimal places
      expect(result.costEuros.toString()).toMatch(/^\d+\.\d{4}$/);

      // Temperatures and deltaT: 2 decimal places
      expect(result.indoorTemp).toBe(21.26);
      expect(result.outdoorTemp).toBe(5.75);
      expect(result.deltaT).toBe(15.5);
    });
  });

  describe('energy formula validation', () => {
    it('should apply the correct energy formula', () => {
      // Test the formula: Watts = ΔT × Surface × U × (duration/3600)
      const indoorTemp = 20.0;
      const outdoorTemp = 10.0;
      const durationSeconds = 3600; // 1 hour for easy calculation

      const result = (service as any).performEnergyCalculation({
        indoorTemp,
        outdoorTemp,
        durationSeconds,
      });

      // ΔT = 20 - 10 = 10°C
      // Watts = 10 × 2.0 × 3.5 × (3600/3600) = 70W
      expect(result.energyLossWatts).toBe(70.0);

      // Cost = 0.07 kWh × 0.174 €/kWh = 0.01218 €
      expect(result.costEuros).toBe(0.0122);

      // CO2 = 0.07 kWh × 56 g/kWh = 3.92 g
      expect(result.co2EmissionsGrams).toBe(3.92);
    });

    it('should handle zero duration correctly', () => {
      const result = (service as any).performEnergyCalculation({
        indoorTemp: 20.0,
        outdoorTemp: 10.0,
        durationSeconds: 0,
      });

      expect(result.energyLossWatts).toBe(0.0);
      expect(result.costEuros).toBe(0.0);
      expect(result.co2EmissionsGrams).toBe(0.0);
    });
  });
});