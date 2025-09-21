import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoorState, SensorReading } from '../shared/entities';
import { MqttModule } from '../mqtt/mqtt.module';
import { ConfigurationModule } from '../shared/config/config.module';
import { DoorService } from './door.service';
import { RuuviParser } from './ruuvi.parser';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoorState, SensorReading]),
    MqttModule,
    ConfigurationModule,
    forwardRef(() => import('../energy/energy.module').then(m => m.EnergyModule)),
  ],
  providers: [DoorService, RuuviParser],
  exports: [DoorService, RuuviParser],
})
export class SensorsModule {}