import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SensorsModule } from '../sensors/sensors.module';
import { EnergyModule } from '../energy/energy.module';
import { GamificationModule } from '../gamification/gamification.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    AuthModule,
    SensorsModule,
    EnergyModule,
    GamificationModule,
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}