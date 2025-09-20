import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { ConfigurationService } from '../shared/config/configuration.service';

@Module({
  providers: [MqttService, ConfigurationService],
  exports: [MqttService],
})
export class MqttModule {}