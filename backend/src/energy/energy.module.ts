import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyMetric, DoorState } from '../shared/entities';
import { SensorsModule } from '../sensors/sensors.module';
import { ConfigurationModule } from '../shared/config/config.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { GamificationModule } from '../gamification/gamification.module';
import { EnergyService } from './energy.service';
import { WeatherService } from './weather.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyMetric, DoorState]),
    forwardRef(() => SensorsModule),
    forwardRef(() => GamificationModule),
    ConfigurationModule,
    WebSocketModule,
  ],
  providers: [EnergyService, WeatherService],
  exports: [EnergyService, WeatherService],
})
export class EnergyModule {}