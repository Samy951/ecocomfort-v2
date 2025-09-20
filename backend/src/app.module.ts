import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigurationService } from './shared/config/configuration.service';
import { WebSocketModule } from './websocket/websocket.module';
import { MqttModule } from './mqtt/mqtt.module';
import { AuthModule } from './auth/auth.module';
import { SensorsModule } from './sensors/sensors.module';
import { EnergyModule } from './energy/energy.module';
import { GamificationModule } from './gamification/gamification.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        autoLoadEntities: true,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    WebSocketModule,
    MqttModule,
    AuthModule,
    SensorsModule,
    EnergyModule,
    GamificationModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConfigurationService],
})
export class AppModule {}
