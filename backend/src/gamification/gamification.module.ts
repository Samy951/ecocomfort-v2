import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserBadge } from '../shared/entities';
import { SensorsModule } from '../sensors/sensors.module';
import { GamificationService } from './gamification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserBadge]),
    SensorsModule,
  ],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}