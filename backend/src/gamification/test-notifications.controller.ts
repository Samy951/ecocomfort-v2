import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EcoWebSocketGateway } from '../websocket/websocket.gateway';
import { BadgeType } from '../shared/enums/badge-type.enum';
import { UserLevel } from '../shared/enums/user-level.enum';

@ApiTags('Test Notifications')
@Controller('test-notifications')
@UseGuards(JwtAuthGuard)
export class TestNotificationsController {
  constructor(
    private readonly webSocketGateway: EcoWebSocketGateway,
  ) {}

  @Post('points')
  async testPoints(@Body() body: { userId: number; points: number }) {
    this.webSocketGateway.emitPointsAwarded(
      body.userId,
      [{ points: body.points || 10, reason: 'Test points' }],
      100 + body.points,
    );
    return { message: 'Points event emitted' };
  }

  @Post('badge')
  async testBadge(@Body() body: { userId: number; badgeType?: string }) {
    const badgeType = (body.badgeType as BadgeType) || BadgeType.QUICK_CLOSE;
    this.webSocketGateway.emitBadgeAwarded(
      body.userId,
      badgeType,
      'Badge de test débloqué !',
    );
    return { message: 'Badge event emitted' };
  }

  @Post('level-up')
  async testLevelUp(@Body() body: { userId: number }) {
    this.webSocketGateway.emitLevelUp(
      body.userId,
      UserLevel.BRONZE,
      UserLevel.SILVER,
    );
    return { message: 'Level-up event emitted' };
  }

  @Post('door-state')
  async testDoorState() {
    this.webSocketGateway.emitDoorStateChanged(true);
    return { message: 'Door state event emitted' };
  }

  @Post('sensor-data')
  async testSensorData() {
    this.webSocketGateway.emitSensorDataUpdated(25.0, 60.0);
    return { message: 'Sensor data event emitted' };
  }
}