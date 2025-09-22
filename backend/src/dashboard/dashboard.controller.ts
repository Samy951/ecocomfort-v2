import {
  Controller,
  Get,
  Query,
  UseGuards,
  Inject,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DoorService } from '../sensors/door.service';
import { RuuviParser } from '../sensors/ruuvi.parser';
import { EnergyService } from '../energy/energy.service';
import { EnergyMetric } from '../shared/entities/energy-metric.entity';
import { DoorState } from '../shared/entities/door-state.entity';
import {
  CurrentSensorsDto,
  CurrentEnergyDto,
  DailyReportDto,
  EnergyHistoryDto,
  SensorStatusDto,
  HourlyMetric,
  DailyTotals,
  PaginationDto,
} from './dto/dashboard.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(
    private readonly doorService: DoorService,
    private readonly ruuviParser: RuuviParser,
    private readonly energyService: EnergyService,
    @InjectRepository(EnergyMetric)
    private readonly energyMetricRepository: Repository<EnergyMetric>,
    @InjectRepository(DoorState)
    private readonly doorStateRepository: Repository<DoorState>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get('sensors')
  @ApiOperation({ summary: 'Get current sensor states' })
  @ApiResponse({
    status: 200,
    description: 'Current sensor data',
    type: CurrentSensorsDto,
  })
  async getCurrentSensors(): Promise<CurrentSensorsDto> {
    // Get door state
    const doorOpen = this.doorService.currentDoorState?.isOpen || false;

    // Get average temperatures and humidity
    const averageTemperature = this.ruuviParser.getAverageIndoorTemperature();
    const averageHumidity = this.ruuviParser.getAverageIndoorHumidity();

    // Build sensor details in frontend expected format
    const sensorIds = ['944372022', '422801533', '1947698524'];
    const sensors: any[] = [];

    for (const sensorId of sensorIds) {
      const sensorData = this.ruuviParser.getSensorData(sensorId);
      const isOnline = sensorData?.lastUpdate
        ? Date.now() - sensorData.lastUpdate.getTime() < 24 * 60 * 60 * 1000 // 24 hours
        : false;

      // Create separate entries for each measurement type per sensor
      // Temperature entry
      if (sensorData?.temperature !== null && sensorData?.temperature !== undefined) {
        sensors.push({
          sensorId: `${sensorId}-temp`,
          type: 'temperature',
          value: sensorData.temperature,
          lastUpdate: sensorData.lastUpdate,
          isOnline: isOnline,
        });
      }

      // Humidity entry
      if (sensorData?.humidity !== null && sensorData?.humidity !== undefined) {
        sensors.push({
          sensorId: `${sensorId}-hum`,
          type: 'humidity',
          value: sensorData.humidity,
          lastUpdate: sensorData.lastUpdate,
          isOnline: isOnline,
        });
      }

      // If sensor has no data, still add entries with null values
      if (!sensorData || (sensorData.temperature === null && sensorData.humidity === null)) {
        sensors.push({
          sensorId: `${sensorId}-temp`,
          type: 'temperature',
          value: null,
          lastUpdate: null,
          isOnline: false,
        });
        sensors.push({
          sensorId: `${sensorId}-hum`,
          type: 'humidity',
          value: null,
          lastUpdate: null,
          isOnline: false,
        });
      }
    }

    return {
      doorOpen,
      averageTemperature,
      averageHumidity,
      sensors,
      timestamp: new Date(),
    };
  }

  @Get('energy/current')
  @ApiOperation({ summary: 'Get current energy metrics' })
  @ApiResponse({
    status: 200,
    description: 'Current energy data',
    type: CurrentEnergyDto,
  })
  async getCurrentEnergy(): Promise<CurrentEnergyDto> {
    // Get latest energy metric
    const latestMetric = await this.energyMetricRepository.findOne({
      where: {},
      order: { timestamp: 'DESC' },
    });

    if (!latestMetric) {
      // Return default values if no metrics available
      return {
        currentLossWatts: 0,
        currentCostPerHour: 0,
        doorOpenDuration: 0,
        indoorTemp: 0,
        outdoorTemp: 0,
        timestamp: new Date(),
      };
    }

    // Calculate current door open duration if door is open
    let doorOpenDuration = 0;
    if (this.doorService.currentDoorState?.isOpen && this.doorService.currentDoorState?.openedAt) {
      const openingSince = this.doorService.currentDoorState.openedAt;
      doorOpenDuration = Math.floor((Date.now() - openingSince.getTime()) / 1000);
    }

    return {
      currentLossWatts: latestMetric.energyLossWatts,
      currentCostPerHour: latestMetric.costEuros,
      doorOpenDuration,
      indoorTemp: latestMetric.indoorTemp,
      outdoorTemp: latestMetric.outdoorTemp,
      timestamp: latestMetric.timestamp,
    };
  }

  @Get('energy/daily')
  @ApiOperation({ summary: 'Get daily energy report' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date in YYYY-MM-DD format (default: today)',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily energy report',
    type: DailyReportDto,
  })
  async getDailyReport(
    @Query('date') date?: string,
  ): Promise<DailyReportDto> {
    // Validate and set default date
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }

    // Check cache first
    const cacheKey = `daily-report-${targetDate}`;
    const cached = await this.cacheManager.get<DailyReportDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Generate report
    const report = await this.generateDailyReport(targetDate);

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, report, 300);

    return report;
  }

  @Get('energy/history')
  @ApiOperation({ summary: 'Get paginated energy history' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date filter (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date filter (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated energy history',
    type: EnergyHistoryDto,
  })
  async getEnergyHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<EnergyHistoryDto> {
    // Validate pagination
    if (page < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }
    if (pageSize > 100) {
      throw new BadRequestException('Page size cannot exceed 100');
    }

    // Validate date formats
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      throw new BadRequestException('startDate must be in YYYY-MM-DD format');
    }
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new BadRequestException('endDate must be in YYYY-MM-DD format');
    }

    // Build query conditions
    const whereConditions: any = {};
    if (startDate && endDate) {
      whereConditions.timestamp = Between(
        new Date(`${startDate}T00:00:00Z`),
        new Date(`${endDate}T23:59:59Z`),
      );
    }

    // Execute paginated query
    const [data, total] = await this.energyMetricRepository.findAndCount({
      where: whereConditions,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Build pagination metadata
    const pagination: PaginationDto = {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    };

    return {
      data,
      pagination,
    };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get alerts (mock endpoint)' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'severity',
    required: false,
    description: 'Filter by severity',
  })
  @ApiQuery({
    name: 'acknowledged',
    required: false,
    description: 'Filter by acknowledged status',
  })
  @ApiResponse({
    status: 200,
    description: 'Alerts list (currently mock data)',
  })
  async getAlerts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('severity') severity?: string,
    @Query('acknowledged') acknowledged?: boolean,
  ): Promise<any> {
    // Mock endpoint - returns empty data
    return {
      alerts: [],
      pagination: {
        current_page: page || 1,
        last_page: 1,
        per_page: limit || 20,
        total: 0,
      },
      stats: {
        unacknowledged: 0,
        critical: 0,
      },
    };
  }

  private async generateDailyReport(date: string): Promise<DailyReportDto> {
    const startDate = new Date(`${date}T00:00:00Z`);
    const endDate = new Date(`${date}T23:59:59Z`);

    // Get hourly energy metrics
    const hourlyMetrics = await this.energyMetricRepository
      .createQueryBuilder('em')
      .select([
        'EXTRACT(HOUR FROM em.timestamp) as hour',
        'SUM(em.energyLossWatts) as totalLoss',
        'SUM(em.costEuros) as totalCost',
        'COUNT(em.id) as count',
      ])
      .where('em.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('hour')
      .getRawMany();

    // Get hourly door openings
    const doorOpenings = await this.doorStateRepository
      .createQueryBuilder('ds')
      .select([
        'EXTRACT(HOUR FROM ds.timestamp) as hour',
        'COUNT(ds.id) as openings',
        'SUM(ds.durationSeconds) as duration',
      ])
      .where('ds.isOpen = true AND ds.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('hour')
      .getRawMany();

    // Build 24-hour array
    const hourlyData: HourlyMetric[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const energyData = hourlyMetrics.find((h) => parseInt(h.hour) === hour);
      const doorData = doorOpenings.find((h) => parseInt(h.hour) === hour);

      hourlyData.push({
        hour,
        totalLossWatts: energyData ? parseFloat(energyData.totalLoss) : 0,
        totalCostEuros: energyData ? parseFloat(energyData.totalCost) : 0,
        doorOpenings: doorData ? parseInt(doorData.openings) : 0,
        doorOpenDuration: doorData ? parseInt(doorData.duration) : 0,
      });
    }

    // Calculate daily totals
    const dayTotals = await this.energyMetricRepository
      .createQueryBuilder('em')
      .select([
        'SUM(em.energyLossWatts) as totalLoss',
        'SUM(em.costEuros) as totalCost',
        'SUM(em.co2EmissionsGrams) as totalCo2',
        'AVG(em.indoorTemp) as avgIndoor',
        'AVG(em.outdoorTemp) as avgOutdoor',
      ])
      .where('em.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    const doorTotals = await this.doorStateRepository
      .createQueryBuilder('ds')
      .select([
        'COUNT(ds.id) as totalOpenings',
        'SUM(ds.durationSeconds) as totalDuration',
      ])
      .where('ds.isOpen = true AND ds.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    const totals: DailyTotals = {
      totalLossWatts: dayTotals?.totalLoss ? parseFloat(dayTotals.totalLoss) : 0,
      totalCostEuros: dayTotals?.totalCost ? parseFloat(dayTotals.totalCost) : 0,
      totalCo2Grams: dayTotals?.totalCo2 ? parseFloat(dayTotals.totalCo2) : 0,
      totalDoorOpenings: doorTotals?.totalOpenings ? parseInt(doorTotals.totalOpenings) : 0,
      totalDoorOpenDuration: doorTotals?.totalDuration ? parseInt(doorTotals.totalDuration) : 0,
    };

    return {
      date,
      hourlyMetrics: hourlyData,
      totals,
      averageIndoorTemp: dayTotals?.avgIndoor ? parseFloat(dayTotals.avgIndoor) : 0,
      averageOutdoorTemp: dayTotals?.avgOutdoor ? parseFloat(dayTotals.avgOutdoor) : 0,
    };
  }
}