import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoorState, SensorReading } from '../shared/entities';
import { MqttModule } from '../mqtt/mqtt.module';
import { DoorService } from './door.service';
import { RuuviParser } from './ruuvi.parser';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoorState, SensorReading]),
    MqttModule,
  ],
  providers: [DoorService, RuuviParser],
  exports: [DoorService, RuuviParser],
})
export class SensorsModule {}