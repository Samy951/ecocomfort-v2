import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { DashboardController } from './dashboard.controller';
import { DoorService } from '../sensors/door.service';
import { RuuviParser } from '../sensors/ruuvi.parser';
import { EnergyService } from '../energy/energy.service';
import { ConfigurationService } from '../shared/config/configuration.service';
import { EnergyMetric } from '../shared/entities/energy-metric.entity';
import { DoorState } from '../shared/entities/door-state.entity';
import { mockService, MockFactory } from '../shared/testing/mockers';
import {
  CurrentSensorsDto,
  CurrentEnergyDto,
  DailyReportDto,
  EnergyHistoryDto,
} from './dto/dashboard.dto';

describe('DashboardController', () => {
  let controller: DashboardController;
  let doorService: jest.Mocked<DoorService>;
  let ruuviParser: jest.Mocked<RuuviParser>;
  let energyService: jest.Mocked<EnergyService>;
  let energyMetricRepository: jest.Mocked<Repository<EnergyMetric>>;
  let doorStateRepository: jest.Mocked<Repository<DoorState>>;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        mockService(DoorService, {
          currentDoorState: {
            isOpen: false,
            timestamp: new Date('2024-01-15T10:00:00Z'),
          },
        }),
        mockService(RuuviParser, {
          getAverageIndoorTemperature: jest.fn(),
          getAverageIndoorHumidity: jest.fn(),
          getSensorData: jest.fn(),
        }),
        mockService(EnergyService),
        mockService(ConfigurationService, {}),
        {
          provide: getRepositoryToken(EnergyMetric),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DoorState),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    doorService = module.get(DoorService);
    ruuviParser = module.get(RuuviParser);
    energyService = module.get(EnergyService);
    energyMetricRepository = module.get(getRepositoryToken(EnergyMetric));
    doorStateRepository = module.get(getRepositoryToken(DoorState));
    cacheManager = module.get(CACHE_MANAGER);
  });

  describe('getCurrentSensors', () => {
    it('should return current sensor data with door closed', async () => {
      // Arrange
      ruuviParser.getAverageIndoorTemperature.mockReturnValue(22.5);
      ruuviParser.getAverageIndoorHumidity.mockReturnValue(45.2);
      ruuviParser.getSensorData.mockImplementation((sensorId) => ({
        temperature: 22.0,
        humidity: 45.0,
        pressure: 1013.25,
        lastUpdate: new Date(), // Use current time to ensure it's considered online
      }));

      // Act
      const result = await controller.getCurrentSensors();

      // Assert
      expect(result.doorOpen).toBe(false);
      expect(result.averageTemperature).toBe(22.5);
      expect(result.averageHumidity).toBe(45.2);
      expect(result.sensors).toHaveLength(3); // 3 physical sensors
      expect(result.sensors[0]).toEqual({
        sensorId: '944372022',
        type: 'combined',
        temperature: 22.0,
        humidity: 45.0,
        lastUpdate: expect.any(Date),
        isOnline: true,
      });
    });

    it('should return offline sensors when no recent data', async () => {
      // Arrange
      ruuviParser.getAverageIndoorTemperature.mockReturnValue(null);
      ruuviParser.getAverageIndoorHumidity.mockReturnValue(null);
      ruuviParser.getSensorData.mockReturnValue(null);

      // Act
      const result = await controller.getCurrentSensors();

      // Assert
      expect(result.averageTemperature).toBeNull();
      expect(result.averageHumidity).toBeNull();
      expect(result.sensors[0].isOnline).toBe(false);
      expect(result.sensors[0].temperature).toBeNull();
      expect(result.sensors[0].humidity).toBeNull();
    });

    it('should detect door open state', async () => {
      // Arrange
      doorService.currentDoorState = {
        isOpen: true,
        timestamp: new Date('2024-01-15T10:00:00Z'),
      } as any;

      // Act
      const result = await controller.getCurrentSensors();

      // Assert
      expect(result.doorOpen).toBe(true);
    });
  });

  describe('getCurrentEnergy', () => {
    it('should return latest energy metrics', async () => {
      // Arrange
      const mockEnergyMetric = {
        id: 1,
        energyLossWatts: 150.5,
        costEuros: 0.026,
        indoorTemp: 22.5,
        outdoorTemp: 5.2,
        timestamp: new Date('2024-01-15T10:00:00Z'),
      } as EnergyMetric;

      energyMetricRepository.findOne.mockResolvedValue(mockEnergyMetric);

      // Act
      const result = await controller.getCurrentEnergy();

      // Assert
      expect(result.currentLossWatts).toBe(150.5);
      expect(result.currentCostPerHour).toBe(0.026);
      expect(result.doorOpenDuration).toBe(0); // Door is closed
      expect(result.indoorTemp).toBe(22.5);
      expect(result.outdoorTemp).toBe(5.2);
    });

    it('should return default values when no metrics available', async () => {
      // Arrange
      energyMetricRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await controller.getCurrentEnergy();

      // Assert
      expect(result.currentLossWatts).toBe(0);
      expect(result.currentCostPerHour).toBe(0);
      expect(result.doorOpenDuration).toBe(0);
      expect(result.indoorTemp).toBe(0);
      expect(result.outdoorTemp).toBe(0);
    });

    it('should calculate door open duration when door is open', async () => {
      // Arrange
      const mockEnergyMetric = {
        energyLossWatts: 150.5,
        costEuros: 0.026,
        indoorTemp: 22.5,
        outdoorTemp: 5.2,
        timestamp: new Date(),
      } as EnergyMetric;

      energyMetricRepository.findOne.mockResolvedValue(mockEnergyMetric);

      const openingTime = new Date(Date.now() - 300000); // 5 minutes ago
      doorService.currentDoorState = {
        isOpen: true,
        openedAt: openingTime,
      } as any;

      // Act
      const result = await controller.getCurrentEnergy();

      // Assert
      expect(result.doorOpenDuration).toBeGreaterThanOrEqual(299);
      expect(result.doorOpenDuration).toBeLessThanOrEqual(301);
    });
  });

  describe('getDailyReport', () => {
    it('should return cached report when available', async () => {
      // Arrange
      const cachedReport: DailyReportDto = {
        date: '2024-01-15',
        hourlyMetrics: Array(24).fill(null).map((_, hour) => ({
          hour,
          totalLossWatts: 100,
          totalCostEuros: 0.017,
          doorOpenings: 2,
          doorOpenDuration: 120,
        })),
        totals: {
          totalLossWatts: 2400,
          totalCostEuros: 0.408,
          totalCo2Grams: 1200,
          totalDoorOpenings: 48,
          totalDoorOpenDuration: 2880,
        },
        weeklyTotals: {
          totalCostEuros: 2.856,
          totalLossWatts: 16800,
          totalDoorOpenings: 336,
        },
        monthlyTotals: {
          totalCostEuros: 12.24,
          totalLossWatts: 72000,
          totalDoorOpenings: 1440,
        },
        averageIndoorTemp: 22.0,
        averageOutdoorTemp: 5.0,
      };

      cacheManager.get.mockResolvedValue(cachedReport);

      // Act
      const result = await controller.getDailyReport('2024-01-15');

      // Assert
      expect(result).toEqual(cachedReport);
      expect(cacheManager.get).toHaveBeenCalledWith('daily-report-2024-01-15');
    });

    it('should generate and cache report when not cached', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { hour: '10', totalLoss: '150.5', totalCost: '0.026', count: '1' }
        ]),
        getRawOne: jest.fn().mockResolvedValue({
          totalLoss: '150.5',
          totalCost: '0.026',
          totalCo2: '75.25',
          avgIndoor: '22.0',
          avgOutdoor: '5.0',
        }),
      };

      energyMetricRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const mockDoorQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { hour: '10', openings: '2', duration: '120' }
        ]),
        getRawOne: jest.fn().mockResolvedValue({
          totalOpenings: '2',
          totalDuration: '120',
        }),
      };

      doorStateRepository.createQueryBuilder.mockReturnValue(mockDoorQueryBuilder as any);

      // Act
      const result = await controller.getDailyReport('2024-01-15');

      // Assert
      expect(result.date).toBe('2024-01-15');
      expect(result.hourlyMetrics).toHaveLength(24);
      expect(result.hourlyMetrics[10]).toEqual({
        hour: 10,
        totalLossWatts: 150.5,
        totalCostEuros: 0.026,
        doorOpenings: 2,
        doorOpenDuration: 120,
      });
      expect(result.weeklyTotals).toEqual({
        totalCostEuros: expect.any(Number),
        totalLossWatts: expect.any(Number),
        totalDoorOpenings: expect.any(Number),
      });
      expect(result.monthlyTotals).toEqual({
        totalCostEuros: expect.any(Number),
        totalLossWatts: expect.any(Number),
        totalDoorOpenings: expect.any(Number),
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        'daily-report-2024-01-15',
        result,
        300
      );
    });

    it('should validate date format', async () => {
      // Act & Assert
      await expect(controller.getDailyReport('invalid-date')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should use today as default date', async () => {
      // Arrange
      const today = new Date().toISOString().split('T')[0];
      cacheManager.get.mockResolvedValue(null);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getRawOne: jest.fn().mockResolvedValue({}),
      };

      energyMetricRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      doorStateRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await controller.getDailyReport();

      // Assert
      expect(result.date).toBe(today);
      expect(cacheManager.get).toHaveBeenCalledWith(`daily-report-${today}`);
    });
  });

  describe('getEnergyHistory', () => {
    it('should return paginated energy history', async () => {
      // Arrange
      const mockMetrics = [
        {
          id: 1,
          energyLossWatts: 150.5,
          costEuros: 0.026,
          timestamp: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 2,
          energyLossWatts: 200.0,
          costEuros: 0.035,
          timestamp: new Date('2024-01-15T09:00:00Z'),
        },
      ] as EnergyMetric[];

      energyMetricRepository.findAndCount.mockResolvedValue([mockMetrics, 25]);

      // Act
      const result = await controller.getEnergyHistory(1, 20);

      // Assert
      expect(result.data).toEqual(mockMetrics);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 25,
        totalPages: 2,
      });
    });

    it('should handle date filtering', async () => {
      // Arrange
      energyMetricRepository.findAndCount.mockResolvedValue([[], 0]);

      // Act
      await controller.getEnergyHistory(1, 20, '2024-01-01', '2024-01-31');

      // Assert
      expect(energyMetricRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          timestamp: expect.any(Object), // Between condition
        },
        order: { timestamp: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should validate pagination parameters', async () => {
      // Act & Assert
      await expect(controller.getEnergyHistory(0, 20)).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.getEnergyHistory(1, 101)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should validate date formats', async () => {
      // Act & Assert
      await expect(
        controller.getEnergyHistory(1, 20, 'invalid-date')
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.getEnergyHistory(1, 20, '2024-01-01', 'invalid-date')
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle empty results', async () => {
      // Arrange
      energyMetricRepository.findAndCount.mockResolvedValue([[], 0]);

      // Act
      const result = await controller.getEnergyHistory(1, 20);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });
});
