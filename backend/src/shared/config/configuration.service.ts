import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import {
  AppConfig,
  AuthConfig,
  DatabaseConfig,
  EnergyConfig,
  MqttConfig,
  OpenWeatherConfig,
} from './interfaces/app-config.interface';

@Injectable()
export class ConfigurationService {
  private config: AppConfig;

  constructor(private nestConfigService: ConfigService) {
    this.validateAndBuildConfig();
  }

  private validateAndBuildConfig(): void {
    const configSchema = z.object({
      port: z.number().default(3000),
      nodeEnv: z.string().default('development'),
      database: z.object({
        url: z.string().min(1),
      }),
      mqtt: z.object({
        broker: z.string().min(1),
        doorTopic: z.string().default('sensor/door_sensor/RESULT'),
        ruuviTopic: z.string().default('pws-packet/202481601481463/+/+'), // Fixed gateway ID with sensor+datatype wildcards
      }),
      openWeather: z.object({
        apiKey: z.string().min(1),
        lat: z.number().default(48.8566),
        lon: z.number().default(2.3522),
      }),
      auth: z.object({
        jwtSecret: z.string().min(1),
      }),
      energy: z.object({
        doorSurfaceM2: z.number().default(2.0),
        thermalCoefficientU: z.number().default(3.5),
        energyCostPerKwh: z.number().default(0.174),
        co2EmissionsPerKwh: z.number().default(56),
      }),
    });

    const configData = {
      port: parseInt(this.nestConfigService.get<string>('PORT') ?? '3000', 10),
      nodeEnv: this.nestConfigService.get<string>('NODE_ENV') ?? 'development',
      database: {
        url: this.nestConfigService.get<string>('DATABASE_URL'),
      },
      mqtt: {
        broker: this.nestConfigService.get<string>('MQTT_BROKER'),
        doorTopic: this.nestConfigService.get<string>('MQTT_DOOR_TOPIC') ?? 'sensor/door_sensor/RESULT',
        ruuviTopic: this.nestConfigService.get<string>('MQTT_RUUVI_TOPIC') ?? 'pws-packet/202481601481463/+/+',
      },
      openWeather: {
        apiKey: this.nestConfigService.get<string>('OPENWEATHER_API_KEY'),
        lat: parseFloat(this.nestConfigService.get<string>('OPENWEATHER_LAT') ?? '48.8566'),
        lon: parseFloat(this.nestConfigService.get<string>('OPENWEATHER_LON') ?? '2.3522'),
      },
      auth: {
        jwtSecret: this.nestConfigService.get<string>('JWT_SECRET'),
      },
      energy: {
        doorSurfaceM2: parseFloat(this.nestConfigService.get<string>('DOOR_SURFACE_M2') ?? '2.0'),
        thermalCoefficientU: parseFloat(this.nestConfigService.get<string>('THERMAL_COEFFICIENT_U') ?? '3.5'),
        energyCostPerKwh: parseFloat(this.nestConfigService.get<string>('ENERGY_COST_PER_KWH') ?? '0.174'),
        co2EmissionsPerKwh: parseFloat(this.nestConfigService.get<string>('CO2_EMISSIONS_PER_KWH') ?? '56'),
      },
    };

    const result = configSchema.safeParse(configData);
    if (!result.success) {
      throw new Error(`Configuration validation failed: ${result.error.message}`);
    }

    this.config = result.data;
  }

  get database(): DatabaseConfig {
    return this.config.database;
  }

  get mqtt(): MqttConfig {
    return this.config.mqtt;
  }

  get openWeather(): OpenWeatherConfig {
    return this.config.openWeather;
  }

  get auth(): AuthConfig {
    return this.config.auth;
  }

  get energy(): EnergyConfig {
    return this.config.energy;
  }

  get port(): number {
    return this.config.port;
  }

  get isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }
}