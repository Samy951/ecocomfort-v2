import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { BadgeType } from '../shared/enums/badge-type.enum';
import { UserLevel } from '../shared/enums/user-level.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EcoWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EcoWebSocketGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emit(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.log(`Emitted ${event} event`);
  }

  emitDoorStateChanged(isOpen: boolean): void {
    const payload = {
      isOpen,
      timestamp: new Date()
    };
    this.emit('door-state-changed', payload);
  }

  emitSensorDataUpdated(avgTemp: number, avgHumidity: number): void {
    const payload = {
      averageTemperature: avgTemp,
      averageHumidity: avgHumidity,
      timestamp: new Date()
    };
    this.emit('sensor-data-updated', payload);
  }

  emitPointsAwarded(userId: number, pointsAwarded: Array<{points: number, reason: string}>, newTotal: number): void {
    const payload = {
      userId,
      pointsAwarded,
      newTotal,
      timestamp: new Date()
    };
    this.emit('points-awarded', payload);
  }

  emitBadgeAwarded(userId: number, badgeType: BadgeType, description: string): void {
    const payload = {
      userId,
      badgeType,
      description,
      earnedAt: new Date()
    };
    this.emit('badge-awarded', payload);
  }

  emitLevelUp(userId: number, oldLevel: UserLevel, newLevel: UserLevel): void {
    const payload = {
      userId,
      oldLevel,
      newLevel,
      timestamp: new Date()
    };
    this.emit('level-up', payload);
  }
}