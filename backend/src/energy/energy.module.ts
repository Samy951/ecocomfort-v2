import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyMetric } from '../shared/entities';
import { SensorsModule } from '../sensors/sensors.module';
import { EnergyService } from './energy.service';
import { WeatherService } from './weather.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyMetric]),
    SensorsModule,
  ],
  providers: [EnergyService, WeatherService],
  exports: [EnergyService],
})
export class EnergyModule {}