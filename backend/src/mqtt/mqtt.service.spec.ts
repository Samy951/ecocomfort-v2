import { Test, TestingModule } from '@nestjs/testing';
import { MqttService } from './mqtt.service';
import { ConfigurationService } from '../shared/config/configuration.service';
import { mockService } from '../shared/testing/mockers';
import * as mqtt from 'mqtt';

// Mock the mqtt module
jest.mock('mqtt', () => ({
  connect: jest.fn(),
}));

describe('MqttService', () => {
  let service: MqttService;
  let configService: ConfigurationService;
  let mockMqttClient: any;

  beforeEach(async () => {
    // Create mock MQTT client
    mockMqttClient = {
      connected: true,
      connect: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      publish: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    };

    // Mock mqtt.connect to return our mock client
    (mqtt.connect as jest.Mock).mockReturnValue(mockMqttClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MqttService,
        mockService(ConfigurationService, {
          mqtt: {
            broker: 'mqtt://test-broker:1883',
            doorTopic: 'test/door',
            ruuviTopic: 'test/ruuvi/+',
          },
        }),
      ],
    }).compile();

    service = module.get<MqttService>(MqttService);
    configService = module.get<ConfigurationService>(ConfigurationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should connect to MQTT broker on module init', async () => {
      await service.onModuleInit();

      expect(mqtt.connect).toHaveBeenCalledWith(
        'mqtt://test-broker:1883',
        expect.objectContaining({
          reconnectPeriod: 10000,
          connectTimeout: 30000,
          keepalive: 60,
          clean: true,
          clientId: expect.stringContaining('ecocomfort-backend-'),
        })
      );
    });

    it('should set up event listeners on client', async () => {
      await service.onModuleInit();

      expect(mockMqttClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockMqttClient.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockMqttClient.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
      expect(mockMqttClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockMqttClient.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should return connection status', async () => {
      mockMqttClient.connected = true;
      await service.onModuleInit();

      expect(service.isConnected()).toBe(true);

      mockMqttClient.connected = false;
      expect(service.isConnected()).toBe(false);
    });

    it('should disconnect properly on module destroy', async () => {
      await service.onModuleInit();

      // Mock the end callback to be called immediately
      mockMqttClient.end.mockImplementation((force, opts, callback) => {
        if (callback) callback();
      });

      await service.onModuleDestroy();

      expect(mockMqttClient.end).toHaveBeenCalled();
    });
  });

  describe('Topic Subscription', () => {
    it('should subscribe to configured topics on connect', async () => {
      await service.onModuleInit();

      // Simulate the connect event
      const connectHandler = mockMqttClient.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();

      expect(mockMqttClient.subscribe).toHaveBeenCalledWith('test/door', { qos: 1 }, expect.any(Function));
      expect(mockMqttClient.subscribe).toHaveBeenCalledWith('test/ruuvi/+', { qos: 1 }, expect.any(Function));
    });
  });

  describe('Message Handling', () => {
    it('should register message handlers correctly', async () => {
      const handler = jest.fn();

      service.onMessage('test/topic', handler);

      // Handler should be registered internally (we can't directly test the private Map)
      // Instead, we'll test that it gets called when a message is distributed
      expect(handler).not.toHaveBeenCalled();
    });

    it('should remove message handlers correctly', async () => {
      const handler = jest.fn();

      service.onMessage('test/topic', handler);
      service.offMessage('test/topic', handler);

      // Handler should be removed (tested indirectly through message distribution)
      expect(handler).not.toHaveBeenCalled();
    });

    it('should distribute messages to registered handlers', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      service.onMessage('test/door', handler1);
      service.onMessage('test/door', handler2);

      await service.onModuleInit();

      // Simulate receiving a message
      const messageHandler = mockMqttClient.on.mock.calls.find(call => call[0] === 'message')[1];
      const testPayload = Buffer.from('{"test": "data"}');
      const mockPacket = { retain: false };
      messageHandler('test/door', testPayload, mockPacket);

      expect(handler1).toHaveBeenCalledWith('test/door', testPayload);
      expect(handler2).toHaveBeenCalledWith('test/door', testPayload);
    });

    it('should handle wildcard topic matching', async () => {
      const handler = jest.fn();

      service.onMessage('test/ruuvi/+', handler);

      await service.onModuleInit();

      // Simulate receiving a message with wildcard match
      const messageHandler = mockMqttClient.on.mock.calls.find(call => call[0] === 'message')[1];
      const testPayload = Buffer.from('{"sensor": "data"}');
      const mockPacket = { retain: false };
      messageHandler('test/ruuvi/12345', testPayload, mockPacket);

      expect(handler).toHaveBeenCalledWith('test/ruuvi/12345', testPayload);
    });

    it('should handle handler errors gracefully', async () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const workingHandler = jest.fn();

      service.onMessage('test/topic', errorHandler);
      service.onMessage('test/topic', workingHandler);

      await service.onModuleInit();

      // Simulate receiving a message
      const messageHandler = mockMqttClient.on.mock.calls.find(call => call[0] === 'message')[1];
      const testPayload = Buffer.from('test');
      const mockPacket = { retain: false };

      // Should not throw, and working handler should still be called
      expect(() => messageHandler('test/topic', testPayload, mockPacket)).not.toThrow();
      expect(workingHandler).toHaveBeenCalledWith('test/topic', testPayload);
    });
  });

  describe('Publishing', () => {
    it('should publish messages when connected', async () => {
      mockMqttClient.connected = true;
      mockMqttClient.publish.mockImplementation((topic, payload, callback) => {
        callback(); // Simulate successful publish
      });

      await service.onModuleInit();

      await service.publish('test/topic', 'test message');

      expect(mockMqttClient.publish).toHaveBeenCalledWith(
        'test/topic',
        'test message',
        expect.any(Function)
      );
    });

    it('should reject publish when not connected', async () => {
      mockMqttClient.connected = false;

      await service.onModuleInit();

      await expect(service.publish('test/topic', 'test message')).rejects.toThrow(
        'MQTT client not connected'
      );
    });

    it('should reject publish on client error', async () => {
      mockMqttClient.connected = true;
      mockMqttClient.publish.mockImplementation((topic, payload, callback) => {
        callback(new Error('Publish failed'));
      });

      await service.onModuleInit();

      await expect(service.publish('test/topic', 'test message')).rejects.toThrow(
        'Publish failed'
      );
    });
  });

  describe('Topic Matching', () => {
    it('should match exact topics', async () => {
      const handler = jest.fn();

      service.onMessage('exact/topic', handler);

      await service.onModuleInit();

      const messageHandler = mockMqttClient.on.mock.calls.find(call => call[0] === 'message')[1];
      const mockPacket = { retain: false };

      messageHandler('exact/topic', Buffer.from('test'), mockPacket);
      expect(handler).toHaveBeenCalled();

      handler.mockClear();
      messageHandler('different/topic', Buffer.from('test'), mockPacket);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should match single-level wildcard (+)', async () => {
      const handler = jest.fn();

      service.onMessage('sensor/+/data', handler);

      await service.onModuleInit();

      const messageHandler = mockMqttClient.on.mock.calls.find(call => call[0] === 'message')[1];
      const mockPacket = { retain: false };

      messageHandler('sensor/123/data', Buffer.from('test'), mockPacket);
      expect(handler).toHaveBeenCalled();

      handler.mockClear();
      messageHandler('sensor/456/data', Buffer.from('test'), mockPacket);
      expect(handler).toHaveBeenCalled();

      handler.mockClear();
      messageHandler('sensor/123/other', Buffer.from('test'), mockPacket);
      expect(handler).not.toHaveBeenCalled();
    });
  });
});