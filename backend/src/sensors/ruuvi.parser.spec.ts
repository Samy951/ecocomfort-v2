import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RuuviParser } from './ruuvi.parser';
import { SensorReading } from '../shared/entities/sensor-reading.entity';
import { MqttService } from '../mqtt/mqtt.service';
import { ConfigurationService } from '../shared/config/configuration.service';
import { mockService } from '../shared/testing/mockers';

describe('RuuviParser', () => {
  let service: RuuviParser;
  let sensorReadingRepository: Repository<SensorReading>;
  let mqttService: MqttService;
  let configService: ConfigurationService;

  const mockSensorReadingRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMqttService = {
    onMessage: jest.fn(),
  };

  const mockConfigService = {
    mqtt: {
      ruuviTopic: 'pws-packet/202481598160802/+/+',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuuviParser,
        {
          provide: getRepositoryToken(SensorReading),
          useValue: mockSensorReadingRepository,
        },
        mockService(MqttService, mockMqttService),
        mockService(ConfigurationService, mockConfigService),
      ],
    }).compile();

    service = module.get<RuuviParser>(RuuviParser);
    sensorReadingRepository = module.get<Repository<SensorReading>>(getRepositoryToken(SensorReading));
    mqttService = module.get<MqttService>(MqttService);
    configService = module.get<ConfigurationService>(ConfigurationService);

    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should subscribe to MQTT RuuviTag topic', async () => {
      await service.onModuleInit();

      expect(mqttService.onMessage).toHaveBeenCalledWith(
        'pws-packet/202481598160802/+/+',
        expect.any(Function)
      );
    });
  });

  describe('Topic Parsing Tests', () => {
    it('should parse valid topic and extract sensorId/dataType', () => {
      const payload = Buffer.from('{"data": {"temperature": 23.5}}');
      const saveSpy = jest.spyOn(service as any, 'saveSensorReading');
      saveSpy.mockImplementation(() => Promise.resolve());

      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/112', payload);

      expect(saveSpy).toHaveBeenCalledWith('944372022');
    });

    it('should reject invalid topic format', () => {
      const payload = Buffer.from('{"data": {"temperature": 23.5}}');
      const saveSpy = jest.spyOn(service as any, 'saveSensorReading');
      saveSpy.mockImplementation(() => Promise.resolve());

      (service as any).handleRuuviMessage('pws-packet/wrong/format', payload);

      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should reject unknown sensor ID', () => {
      const payload = Buffer.from('{"data": {"temperature": 23.5}}');
      const saveSpy = jest.spyOn(service as any, 'saveSensorReading');
      saveSpy.mockImplementation(() => Promise.resolve());

      (service as any).handleRuuviMessage('pws-packet/202481598160802/unknown/112', payload);

      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should ignore unsupported data types', () => {
      const payload = Buffer.from('{"data": {"accelerometer": 1.5}}');
      const saveSpy = jest.spyOn(service as any, 'saveSensorReading');
      saveSpy.mockImplementation(() => Promise.resolve());

      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/127', payload);

      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  describe('Payload Processing Tests', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'saveSensorReading').mockImplementation(() => Promise.resolve());
    });

    it('should parse temperature payload correctly', () => {
      const payload = Buffer.from('{"data": {"temperature": 23.5}}');

      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/112', payload);

      const sensorStates = (service as any).sensorStates;
      const state = sensorStates.get('944372022');
      expect(state.temperature).toBe(23.5);
    });

    it('should parse humidity payload correctly', () => {
      const payload = Buffer.from('{"data": {"humidity": 65.2}}');

      (service as any).handleRuuviMessage('pws-packet/202481598160802/422801533/114', payload);

      const sensorStates = (service as any).sensorStates;
      const state = sensorStates.get('422801533');
      expect(state.humidity).toBe(65.2);
    });

    it('should parse pressure payload correctly', () => {
      const payload = Buffer.from('{"data": {"pressure": 1013.25}}');

      (service as any).handleRuuviMessage('pws-packet/202481598160802/1947698524/116', payload);

      const sensorStates = (service as any).sensorStates;
      const state = sensorStates.get('1947698524');
      expect(state.pressure).toBe(1013.25);
    });

    it('should handle malformed JSON gracefully', () => {
      const payload = Buffer.from('{"invalid": "json"');
      const saveSpy = jest.spyOn(service as any, 'saveSensorReading');

      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/112', payload);

      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should handle missing data field', () => {
      const payload = Buffer.from('{"other": {"temperature": 23.5}}');
      const saveSpy = jest.spyOn(service as any, 'saveSensorReading');

      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/112', payload);

      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cache Management Tests', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'saveSensorReading').mockImplementation(() => Promise.resolve());
    });

    it('should update sensor state correctly', () => {
      const payload = Buffer.from('{"data": {"temperature": 23.5}}');

      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/112', payload);

      const sensorStates = (service as any).sensorStates;
      const state = sensorStates.get('944372022');
      expect(state.temperature).toBe(23.5);
      expect(state.lastUpdate).toBeInstanceOf(Date);
    });

    it('should preserve previous values when updating different measure types', () => {
      jest.spyOn(service as any, 'saveSensorReading').mockImplementation(() => Promise.resolve());

      // First temperature
      const tempPayload = Buffer.from('{"data": {"temperature": 23.5}}');
      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/112', tempPayload);

      // Then humidity
      const humidityPayload = Buffer.from('{"data": {"humidity": 65.2}}');
      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/114', humidityPayload);

      const sensorStates = (service as any).sensorStates;
      const state = sensorStates.get('944372022');
      expect(state.temperature).toBe(23.5);
      expect(state.humidity).toBe(65.2);
    });

    it('should update timestamp on each message', () => {
      const payload = Buffer.from('{"data": {"temperature": 23.5}}');
      const firstTime = Date.now();

      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/112', payload);

      const sensorStates = (service as any).sensorStates;
      const state = sensorStates.get('944372022');
      expect(state.lastUpdate.getTime()).toBeGreaterThanOrEqual(firstTime);
    });
  });

  describe('Average Temperature Calculation Tests', () => {
    it('should return null when no temperature data available', () => {
      const average = service.getAverageIndoorTemperature();
      expect(average).toBeNull();
    });

    it('should calculate average with one sensor', () => {
      (service as any).sensorStates.set('944372022', {
        temperature: 23.5,
        lastUpdate: new Date()
      });

      const average = service.getAverageIndoorTemperature();
      expect(average).toBe(23.5);
    });

    it('should calculate average with multiple sensors', () => {
      const now = new Date();
      (service as any).sensorStates.set('944372022', {
        temperature: 20.0,
        lastUpdate: now
      });
      (service as any).sensorStates.set('422801533', {
        temperature: 25.0,
        lastUpdate: now
      });
      (service as any).sensorStates.set('1947698524', {
        temperature: 24.0,
        lastUpdate: now
      });

      const average = service.getAverageIndoorTemperature();
      expect(average).toBe(23); // (20 + 25 + 24) / 3 = 23
    });

    it('should exclude sensors without temperature data', () => {
      const now = new Date();
      (service as any).sensorStates.set('944372022', {
        temperature: 20.0,
        lastUpdate: now
      });
      (service as any).sensorStates.set('422801533', {
        humidity: 65.0, // No temperature
        lastUpdate: now
      });

      const average = service.getAverageIndoorTemperature();
      expect(average).toBe(20.0);
    });

    it('should exclude sensors with outdated data', () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

      (service as any).sensorStates.set('944372022', {
        temperature: 20.0,
        lastUpdate: now
      });
      (service as any).sensorStates.set('422801533', {
        temperature: 30.0,
        lastUpdate: oldDate // Too old
      });

      const average = service.getAverageIndoorTemperature();
      expect(average).toBe(20.0);
    });

    it('should round average to 2 decimal places', () => {
      const now = new Date();
      (service as any).sensorStates.set('944372022', {
        temperature: 20.333,
        lastUpdate: now
      });
      (service as any).sensorStates.set('422801533', {
        temperature: 21.666,
        lastUpdate: now
      });

      const average = service.getAverageIndoorTemperature();
      expect(average).toBe(21); // (20.333 + 21.666) / 2 = 20.9995 -> 21
    });
  });

  describe('Database Persistence Tests', () => {
    beforeEach(() => {
      mockSensorReadingRepository.create.mockImplementation((data) => data);
      mockSensorReadingRepository.save.mockImplementation((data) => Promise.resolve({ ...data, id: 1 }));
    });

    it('should create sensor reading with complete state', async () => {
      (service as any).sensorStates.set('944372022', {
        temperature: 23.5,
        humidity: 65.2,
        pressure: 1013.25,
        lastUpdate: new Date()
      });

      await (service as any).saveSensorReading('944372022');

      expect(mockSensorReadingRepository.create).toHaveBeenCalledWith({
        sensorId: '944372022',
        temperature: 23.5,
        humidity: 65.2,
        pressure: 1013.25,
        timestamp: expect.any(Date)
      });
      expect(mockSensorReadingRepository.save).toHaveBeenCalled();
    });

    it('should handle missing values with null', async () => {
      (service as any).sensorStates.set('944372022', {
        temperature: 23.5,
        // humidity and pressure missing
        lastUpdate: new Date()
      });

      await (service as any).saveSensorReading('944372022');

      expect(mockSensorReadingRepository.create).toHaveBeenCalledWith({
        sensorId: '944372022',
        temperature: 23.5,
        humidity: null,
        pressure: null,
        timestamp: expect.any(Date)
      });
    });

    it('should handle database errors gracefully', async () => {
      mockSensorReadingRepository.save.mockRejectedValue(new Error('DB Error'));
      (service as any).sensorStates.set('944372022', {
        temperature: 23.5,
        lastUpdate: new Date()
      });

      await expect((service as any).saveSensorReading('944372022')).resolves.not.toThrow();
    });
  });

  describe('End-to-End Scenarios', () => {
    beforeEach(() => {
      mockSensorReadingRepository.create.mockImplementation((data) => data);
      mockSensorReadingRepository.save.mockImplementation((data) => Promise.resolve({ ...data, id: Date.now() }));
    });

    it('should process complete sensor data cycle', async () => {
      // Temperature
      const tempPayload = Buffer.from('{"data": {"temperature": 23.5}}');
      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/112', tempPayload);

      // Humidity
      const humidityPayload = Buffer.from('{"data": {"humidity": 65.2}}');
      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/114', humidityPayload);

      // Pressure
      const pressurePayload = Buffer.from('{"data": {"pressure": 1013.25}}');
      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/116', pressurePayload);

      // Check state
      const sensorStates = (service as any).sensorStates;
      const state = sensorStates.get('944372022');
      expect(state.temperature).toBe(23.5);
      expect(state.humidity).toBe(65.2);
      expect(state.pressure).toBe(1013.25);

      // Check average calculation
      const average = service.getAverageIndoorTemperature();
      expect(average).toBe(23.5);

      // Check database saves
      expect(mockSensorReadingRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple sensors independently', async () => {
      // Sensor 1 temperature
      const temp1Payload = Buffer.from('{"data": {"temperature": 20.0}}');
      (service as any).handleRuuviMessage('pws-packet/202481598160802/944372022/112', temp1Payload);

      // Sensor 2 temperature
      const temp2Payload = Buffer.from('{"data": {"temperature": 25.0}}');
      (service as any).handleRuuviMessage('pws-packet/202481598160802/422801533/112', temp2Payload);

      // Check average
      const average = service.getAverageIndoorTemperature();
      expect(average).toBe(22.5); // (20 + 25) / 2

      // Check both sensors have independent states
      const sensorStates = (service as any).sensorStates;
      expect(sensorStates.get('944372022').temperature).toBe(20.0);
      expect(sensorStates.get('422801533').temperature).toBe(25.0);
    });
  });
});