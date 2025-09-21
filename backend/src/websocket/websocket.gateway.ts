import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EcoWebSocketGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EcoWebSocketGateway.name);

  emit(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.log(`Emitted ${event} event`);
  }
}