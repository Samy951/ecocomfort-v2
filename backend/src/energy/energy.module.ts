import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyMetric } from '../shared/entities';
import { SensorsModule } from '../sensors/sensors.module';
import { ConfigurationModule } from '../shared/config/config.module';
import { EnergyService } from './energy.service';
import { WeatherService } from './weather.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyMetric]),
    SensorsModule,
    ConfigurationModule,
  ],
  providers: [EnergyService, WeatherService],
  exports: [EnergyService, WeatherService],
})
export class EnergyModule {}