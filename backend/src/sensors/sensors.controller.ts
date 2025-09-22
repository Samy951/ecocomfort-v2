import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Sensors')
@Controller('sensors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SensorsController {
  @Get(':id/history')
  @ApiOperation({ summary: 'Get sensor history (mock endpoint)' })
  @ApiParam({
    name: 'id',
    description: 'Sensor ID',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    description: 'Start date filter',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    description: 'End date filter',
  })
  @ApiQuery({
    name: 'interval',
    required: false,
    description: 'Data interval',
  })
  @ApiResponse({
    status: 200,
    description: 'Sensor history (currently mock data)',
  })
  async getSensorHistory(
    @Param('id') sensorId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('interval') interval?: string,
    @Query('metrics') metrics?: string[],
  ): Promise<any> {
    // Mock endpoint - returns empty data
    return {
      data: [],
      sensor: {
        sensorId: sensorId,
        type: 'temperature',
        value: null,
        lastUpdate: null,
        isOnline: false,
      },
    };
  }
}