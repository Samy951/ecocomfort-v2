import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from '../auth/auth.module';
import { SensorsModule } from '../sensors/sensors.module';
import { EnergyModule } from '../energy/energy.module';
import { GamificationModule } from '../gamification/gamification.module';
import { DashboardController } from './dashboard.controller';
import { EnergyMetric } from '../shared/entities/energy-metric.entity';
import { DoorState } from '../shared/entities/door-state.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyMetric, DoorState]),
    CacheModule.register({
      ttl: 300, // 5 minutes
      max: 100, // maximum number of items in cache
    }),
    AuthModule,
    SensorsModule,
    EnergyModule,
    GamificationModule,
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}