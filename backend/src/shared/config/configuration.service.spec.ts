import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConfigurationService } from './configuration.service';
import { mockService } from '../testing/mockers';

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let configService: ConfigService;

  describe('Validation réussie', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ConfigurationService,
          mockService(ConfigService, {
            get: jest.fn((key: string) => {
              const mockValues = {
                PORT: 3000,
                NODE_ENV: 'development',
                DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
                MQTT_BROKER: 'mqtt://localhost:1883',
                MQTT_DOOR_TOPIC: 'sensor/door_sensor/RESULT',
                MQTT_RUUVI_TOPIC: 'pws-packet/202481598160802/+',
                OPENWEATHER_API_KEY: 'test-api-key',
                OPENWEATHER_LAT: 48.8566,
                OPENWEATHER_LON: 2.3522,
                JWT_SECRET: 'test-jwt-secret',
                DOOR_SURFACE_M2: 2.0,
                THERMAL_COEFFICIENT_U: 3.5,
                ENERGY_COST_PER_KWH: 0.174,
              };
              return mockValues[key];
            }),
          }),
        ],
      }).compile();

      service = module.get<ConfigurationService>(ConfigurationService);
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return correct database config', () => {
      const database = service.database;
      expect(database.url).toBe('postgresql://user:pass@localhost:5432/db');
    });

    it('should return correct mqtt config', () => {
      const mqtt = service.mqtt;
      expect(mqtt.broker).toBe('mqtt://localhost:1883');
      expect(mqtt.doorTopic).toBe('sensor/door_sensor/RESULT');
      expect(mqtt.ruuviTopic).toBe('pws-packet/202481598160802/+');
    });

    it('should return correct openWeather config', () => {
      const openWeather = service.openWeather;
      expect(openWeather.apiKey).toBe('test-api-key');
      expect(openWeather.lat).toBe(48.8566);
      expect(openWeather.lon).toBe(2.3522);
    });

    it('should return correct auth config', () => {
      const auth = service.auth;
      expect(auth.jwtSecret).toBe('test-jwt-secret');
    });

    it('should return correct energy config', () => {
      const energy = service.energy;
      expect(energy.doorSurfaceM2).toBe(2.0);
      expect(energy.thermalCoefficientU).toBe(3.5);
      expect(energy.energyCostPerKwh).toBe(0.174);
    });

    it('should return correct port', () => {
      expect(service.port).toBe(3000);
    });

    it('should return correct environment flags', () => {
      expect(service.isDevelopment).toBe(true);
      expect(service.isProduction).toBe(false);
    });
  });

  describe('Valeurs par défaut', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ConfigurationService,
          mockService(ConfigService, {
            get: jest.fn((key: string) => {
              const requiredValues = {
                DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
                MQTT_BROKER: 'mqtt://localhost:1883',
                OPENWEATHER_API_KEY: 'test-api-key',
                JWT_SECRET: 'test-jwt-secret',
              };
              return requiredValues[key] || undefined;
            }),
          }),
        ],
      }).compile();

      service = module.get<ConfigurationService>(ConfigurationService);
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should apply default values for optional variables', () => {
      expect(service.port).toBe(3000);
      expect(service.mqtt.doorTopic).toBe('sensor/door_sensor/RESULT');
      expect(service.mqtt.ruuviTopic).toBe('pws-packet/202481598160802/+');
      expect(service.openWeather.lat).toBe(48.8566);
      expect(service.openWeather.lon).toBe(2.3522);
      expect(service.energy.doorSurfaceM2).toBe(2.0);
      expect(service.energy.thermalCoefficientU).toBe(3.5);
      expect(service.energy.energyCostPerKwh).toBe(0.174);
    });
  });

  describe('Validation échouée - Variables manquantes', () => {
    it('should throw error when DATABASE_URL is missing', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const values = {
            MQTT_BROKER: 'mqtt://localhost:1883',
            OPENWEATHER_API_KEY: 'test-api-key',
            JWT_SECRET: 'test-jwt-secret',
          };
          return values[key];
        }),
      };

      expect(() => {
        new ConfigurationService(mockConfigService as any);
      }).toThrow('Configuration validation failed');
    });

    it('should throw error when MQTT_BROKER is missing', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const values = {
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            OPENWEATHER_API_KEY: 'test-api-key',
            JWT_SECRET: 'test-jwt-secret',
          };
          return values[key];
        }),
      };

      expect(() => {
        new ConfigurationService(mockConfigService as any);
      }).toThrow('Configuration validation failed');
    });

    it('should throw error when JWT_SECRET is missing', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const values = {
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            MQTT_BROKER: 'mqtt://localhost:1883',
            OPENWEATHER_API_KEY: 'test-api-key',
          };
          return values[key];
        }),
      };

      expect(() => {
        new ConfigurationService(mockConfigService as any);
      }).toThrow('Configuration validation failed');
    });

    it('should throw error when OPENWEATHER_API_KEY is missing', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const values = {
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            MQTT_BROKER: 'mqtt://localhost:1883',
            JWT_SECRET: 'test-jwt-secret',
          };
          return values[key];
        }),
      };

      expect(() => {
        new ConfigurationService(mockConfigService as any);
      }).toThrow('Configuration validation failed');
    });
  });

  describe('Environnements', () => {
    it('should return true for isDevelopment when NODE_ENV is development', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const mockValues = {
            NODE_ENV: 'development',
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            MQTT_BROKER: 'mqtt://localhost:1883',
            OPENWEATHER_API_KEY: 'test-api-key',
            JWT_SECRET: 'test-jwt-secret',
          };
          return mockValues[key];
        }),
      };

      const testService = new ConfigurationService(mockConfigService as any);
      expect(testService.isDevelopment).toBe(true);
      expect(testService.isProduction).toBe(false);
    });

    it('should return true for isProduction when NODE_ENV is production', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const mockValues = {
            NODE_ENV: 'production',
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            MQTT_BROKER: 'mqtt://localhost:1883',
            OPENWEATHER_API_KEY: 'test-api-key',
            JWT_SECRET: 'test-jwt-secret',
          };
          return mockValues[key];
        }),
      };

      const testService = new ConfigurationService(mockConfigService as any);
      expect(testService.isDevelopment).toBe(false);
      expect(testService.isProduction).toBe(true);
    });
  });
});