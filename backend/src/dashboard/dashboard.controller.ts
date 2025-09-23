import {
  Controller,
  Get,
  Query,
  Param,
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
import { ConfigurationService } from '../shared/config/configuration.service';
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
    private readonly configService: ConfigurationService,
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

      // Create a single sensor entry with both temperature and humidity
      sensors.push({
        sensorId: sensorId, // Keep original sensorId without suffix
        type: 'combined', // Indicate this contains both temp and humidity
        temperature: sensorData?.temperature !== null && sensorData?.temperature !== undefined ? sensorData.temperature : null,
        humidity: sensorData?.humidity !== null && sensorData?.humidity !== undefined ? sensorData.humidity : null,
        lastUpdate: sensorData?.lastUpdate || null,
        isOnline: isOnline,
      });
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

    // Calculate current door open duration if door is open
    let doorOpenDuration = 0;
    let currentLossWatts = 0;
    let currentCostPerHour = 0;
    let cumulativeCostEuros = 0;
    let indoorTemp = 0;
    let outdoorTemp = 0;

    if (this.doorService.currentDoorState?.isOpen && this.doorService.currentDoorState?.openedAt) {
      const openingSince = this.doorService.currentDoorState.openedAt;
      doorOpenDuration = Math.floor((Date.now() - openingSince.getTime()) / 1000);

      // Calculate real-time energy loss while door is open
      const avgIndoorTemp = this.ruuviParser.getAverageIndoorTemperature();
      if (avgIndoorTemp !== null) {
        // Use latest outdoor temp from metric or try to get fresh data
        const latestOutdoorTemp = latestMetric?.outdoorTemp || 15; // fallback
        const deltaT = avgIndoorTemp - latestOutdoorTemp;

        if (deltaT > 0) {
          // Calculate instantaneous power loss (Watts per hour)
          const config = this.configService.energy;
          const instantPowerLossWatts = Math.round(deltaT * config.doorSurfaceM2 * config.thermalCoefficientU * 100) / 100;

          // For display, calculate cumulative loss based on duration
          const durationHours = doorOpenDuration / 3600;
          currentLossWatts = Math.round(instantPowerLossWatts * durationHours * 100) / 100;

          // Cost per hour: convert watts to kW and multiply by tariff
          currentCostPerHour = Math.round((instantPowerLossWatts / 1000) * config.energyCostPerKwh * 100000) / 100000;

          // Calculate cumulative cost for this session: total energy consumed * tariff
          cumulativeCostEuros = Math.round((currentLossWatts / 1000) * config.energyCostPerKwh * 100000) / 100000;
        }

        indoorTemp = avgIndoorTemp;
        outdoorTemp = latestOutdoorTemp;
      }
    } else if (latestMetric) {
      // Door is closed, use latest metric values
      currentLossWatts = latestMetric.energyLossWatts;
      currentCostPerHour = latestMetric.costEuros;
      indoorTemp = latestMetric.indoorTemp;
      outdoorTemp = latestMetric.outdoorTemp;
    }

    return {
      currentLossWatts,
      currentCostPerHour,
      cumulativeCostEuros,
      doorOpenDuration,
      indoorTemp,
      outdoorTemp,
      timestamp: new Date(),
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

  @Get('energy/chart-data')
  @ApiOperation({ summary: 'Get energy data for chart (last 24h)' })
  @ApiResponse({
    status: 200,
    description: 'Chart data for last 24 hours',
  })
  async getChartData(): Promise<any> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get energy metrics from last 24h grouped by hour
    const energyData = await this.energyMetricRepository
      .createQueryBuilder('em')
      .select([
        'EXTRACT(HOUR FROM em.timestamp) as hour',
        'AVG(em.indoorTemp) as avgIndoorTemp',
        'AVG(em.outdoorTemp) as avgOutdoorTemp',
        'SUM(em.energyLossWatts) as totalEnergyLoss',
        'SUM(em.costEuros) as totalCost',
        'COUNT(em.id) as count',
      ])
      .where('em.timestamp >= :last24Hours', { last24Hours })
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();

    // Build 24-hour chart data
    const chartData: any[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const currentTime = new Date();
      const targetTime = new Date(currentTime.getTime() - (23 - hour) * 60 * 60 * 1000);

      const hourData = energyData.find(d => parseInt(d.hour) === targetTime.getHours());

      chartData.push({
        name: `${targetTime.getHours()}h`,
        hour: targetTime.getHours(),
        timestamp: targetTime.toISOString(),
        temperature: hourData ? parseFloat(hourData.avgindoortemp) : null,
        outdoorTemp: hourData ? parseFloat(hourData.avgoutdoortemp) : null,
        energyLoss: hourData ? parseFloat(hourData.totalenergyloss) : 0,
        cost: hourData ? parseFloat(hourData.totalcost) : 0,
        count: hourData ? parseInt(hourData.count) : 0,
      });
    }

    return chartData;
  }

  @Get('test/door/:action')
  @ApiOperation({ summary: 'Test door state change (development only)' })
  async testDoorState(@Param('action') action: string): Promise<any> {
    if (process.env.NODE_ENV !== 'development') {
      throw new BadRequestException('Test endpoints only available in development');
    }

    const isOpen = action === 'open';

    // Simulate MQTT message processing
    await this.doorService.simulateDoorStateChange(isOpen);

    return {
      message: `Door state changed to: ${isOpen ? 'OPEN' : 'CLOSED'}`,
      doorOpen: isOpen,
      timestamp: new Date()
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

    // Calculate weekly totals (last 7 days)
    const weekStart = new Date(startDate.getTime() - 6 * 24 * 60 * 60 * 1000);
    const weeklyTotals = await this.calculatePeriodTotals(weekStart, endDate);

    // Calculate monthly totals (last 30 days)
    const monthStart = new Date(startDate.getTime() - 29 * 24 * 60 * 60 * 1000);
    const monthlyTotals = await this.calculatePeriodTotals(monthStart, endDate);

    return {
      date,
      hourlyMetrics: hourlyData,
      totals,
      weeklyTotals,
      monthlyTotals,
      averageIndoorTemp: dayTotals?.avgIndoor ? parseFloat(dayTotals.avgIndoor) : 0,
      averageOutdoorTemp: dayTotals?.avgOutdoor ? parseFloat(dayTotals.avgOutdoor) : 0,
    };
  }

  private async calculatePeriodTotals(startDate: Date, endDate: Date): Promise<{ totalCostEuros: number; totalLossWatts: number; totalDoorOpenings: number }> {
    // Calculate period energy totals
    const energyTotals = await this.energyMetricRepository
      .createQueryBuilder('em')
      .select([
        'SUM(em.energyLossWatts) as totalLoss',
        'SUM(em.costEuros) as totalCost',
      ])
      .where('em.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    // Calculate period door totals
    const doorTotals = await this.doorStateRepository
      .createQueryBuilder('ds')
      .select(['COUNT(ds.id) as totalOpenings'])
      .where('ds.isOpen = true AND ds.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return {
      totalCostEuros: energyTotals?.totalCost ? parseFloat(energyTotals.totalCost) : 0,
      totalLossWatts: energyTotals?.totalLoss ? parseFloat(energyTotals.totalLoss) : 0,
      totalDoorOpenings: doorTotals?.totalOpenings ? parseInt(doorTotals.totalOpenings) : 0,
    };
  }
}