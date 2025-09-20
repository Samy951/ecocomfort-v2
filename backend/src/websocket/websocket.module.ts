import { Global, Module } from '@nestjs/common';
import { EcoWebSocketGateway } from './websocket.gateway';

@Global()
@Module({
  providers: [EcoWebSocketGateway],
  exports: [EcoWebSocketGateway],
})
export class WebSocketModule {}