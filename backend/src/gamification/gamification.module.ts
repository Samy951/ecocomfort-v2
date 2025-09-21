import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../shared/entities/user.entity';
import { UserBadge } from '../shared/entities/user-badge.entity';
import { DoorState } from '../shared/entities/door-state.entity';
import { EnergyMetric } from '../shared/entities/energy-metric.entity';
import { WebSocketModule } from '../websocket/websocket.module';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserBadge,
      DoorState,
      EnergyMetric,
    ]),
    WebSocketModule,
  ],
  providers: [GamificationService],
  controllers: [GamificationController],
  exports: [GamificationService],
})
export class GamificationModule {}