import { ApiProperty } from '@nestjs/swagger';
import { EnergyMetric } from '../../shared/entities/energy-metric.entity';

export class SensorStatusDto {
  @ApiProperty({ description: 'Physical sensor ID' })
  sensorId: string;

  @ApiProperty({
    enum: ['temperature', 'humidity', 'pressure'],
    description: 'Type of sensor measurement'
  })
  type: 'temperature' | 'humidity' | 'pressure';

  @ApiProperty({
    type: 'number',
    nullable: true,
    description: 'Current sensor value'
  })
  value: number | null;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    nullable: true,
    description: 'Last update timestamp'
  })
  lastUpdate: Date | null;

  @ApiProperty({ description: 'Is sensor currently online' })
  isOnline: boolean;
}

export class CurrentSensorsDto {
  @ApiProperty({ description: 'Current door state (true = open)' })
  doorOpen: boolean;

  @ApiProperty({
    type: 'number',
    nullable: true,
    description: 'Average temperature from 3 RuuviTag sensors'
  })
  averageTemperature: number | null;

  @ApiProperty({
    type: 'number',
    nullable: true,
    description: 'Average humidity from 3 RuuviTag sensors'
  })
  averageHumidity: number | null;

  @ApiProperty({
    type: [SensorStatusDto],
    description: 'Individual sensor details'
  })
  sensors: SensorStatusDto[];

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Response timestamp'
  })
  timestamp: Date;
}

export class CurrentEnergyDto {
  @ApiProperty({ description: 'Current energy loss in watts' })
  currentLossWatts: number;

  @ApiProperty({ description: 'Current cost per hour in euros' })
  currentCostPerHour: number;

  @ApiProperty({ description: 'Cumulative cost for current session in euros' })
  cumulativeCostEuros: number;

  @ApiProperty({ description: 'Door open duration in seconds' })
  doorOpenDuration: number;

  @ApiProperty({ description: 'Indoor temperature' })
  indoorTemp: number;

  @ApiProperty({ description: 'Outdoor temperature' })
  outdoorTemp: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Metric timestamp'
  })
  timestamp: Date;
}

export class HourlyMetric {
  @ApiProperty({ minimum: 0, maximum: 23, description: 'Hour of day (0-23)' })
  hour: number;

  @ApiProperty({ description: 'Total energy loss for the hour in watts' })
  totalLossWatts: number;

  @ApiProperty({ description: 'Total cost for the hour in euros' })
  totalCostEuros: number;

  @ApiProperty({ description: 'Number of door openings in the hour' })
  doorOpenings: number;

  @ApiProperty({ description: 'Total door open duration in seconds' })
  doorOpenDuration: number;
}

export class DailyTotals {
  @ApiProperty({ description: 'Total energy loss for the day in watts' })
  totalLossWatts: number;

  @ApiProperty({ description: 'Total cost for the day in euros' })
  totalCostEuros: number;

  @ApiProperty({ description: 'Total CO2 emissions in grams' })
  totalCo2Grams: number;

  @ApiProperty({ description: 'Total number of door openings' })
  totalDoorOpenings: number;

  @ApiProperty({ description: 'Total door open duration in seconds' })
  totalDoorOpenDuration: number;
}

export class PeriodTotals {
  @ApiProperty({ description: 'Total cost in euros for the period' })
  totalCostEuros: number;

  @ApiProperty({ description: 'Total energy loss in watts for the period' })
  totalLossWatts: number;

  @ApiProperty({ description: 'Total door openings for the period' })
  totalDoorOpenings: number;
}

export class DailyReportDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({
    type: [HourlyMetric],
    description: 'Array of 24 hourly metrics (0-23h)',
    minItems: 24,
    maxItems: 24
  })
  hourlyMetrics: HourlyMetric[];

  @ApiProperty({
    type: DailyTotals,
    description: 'Daily aggregated totals'
  })
  totals: DailyTotals;

  @ApiProperty({
    type: PeriodTotals,
    description: 'Weekly aggregated totals'
  })
  weeklyTotals: PeriodTotals;

  @ApiProperty({
    type: PeriodTotals,
    description: 'Monthly aggregated totals'
  })
  monthlyTotals: PeriodTotals;

  @ApiProperty({ description: 'Average indoor temperature for the day' })
  averageIndoorTemp: number;

  @ApiProperty({ description: 'Average outdoor temperature for the day' })
  averageOutdoorTemp: number;
}

export class PaginationDto {
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  pageSize: number;

  @ApiProperty({ description: 'Total number of items' })
  totalItems: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class EnergyHistoryDto {
  @ApiProperty({
    type: [EnergyMetric],
    description: 'Array of energy metrics'
  })
  data: EnergyMetric[];

  @ApiProperty({
    type: PaginationDto,
    description: 'Pagination metadata'
  })
  pagination: PaginationDto;
}

export class DoorUsageStatsDto {
  @ApiProperty({ description: 'Date of the statistics' })
  day: string;

  @ApiProperty({ description: 'Number of door openings' })
  opens: number;

  @ApiProperty({ description: 'Number of door closures' })
  closes: number;

  @ApiProperty({
    description: 'Average door open duration in seconds',
    nullable: true
  })
  avgDuration: number;
}

export class SavingsStatsDto {
  @ApiProperty({ description: 'Savings for current month in euros' })
  thisMonth: number;

  @ApiProperty({ description: 'Savings for last month in euros' })
  lastMonth: number;

  @ApiProperty({ description: 'Total savings in euros' })
  total: number;

  @ApiProperty({ description: 'Number of quick door closes this month' })
  quickCloseCount: number;

  @ApiProperty({ description: 'Estimated yearly savings in euros' })
  estimatedYearly: number;
}

export class ActivityDataDto {
  @ApiProperty({ description: 'Date of activity' })
  date: string;

  @ApiProperty({ description: 'Points earned that day' })
  points: number;

  @ApiProperty({ description: 'Energy saved in watts' })
  energy_saved: number;
}