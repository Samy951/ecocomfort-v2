import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoorService } from './door.service';
import { DoorState } from '../shared/entities/door-state.entity';
import { MqttService } from '../mqtt/mqtt.service';
import { ConfigurationService } from '../shared/config/configuration.service';
import { mockService } from '../shared/testing/mockers';

describe('DoorService', () => {
  let service: DoorService;
  let doorStateRepository: Repository<DoorState>;
  let mqttService: MqttService;
  let configService: ConfigurationService;

  const mockDoorStateRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockMqttService = {
    onMessage: jest.fn(),
  };

  const mockConfigService = {
    mqtt: {
      doorTopic: 'sensor/door_sensor/RESULT',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoorService,
        {
          provide: getRepositoryToken(DoorState),
          useValue: mockDoorStateRepository,
        },
        mockService(MqttService, mockMqttService),
        mockService(ConfigurationService, mockConfigService),
      ],
    }).compile();

    service = module.get<DoorService>(DoorService);
    doorStateRepository = module.get<Repository<DoorState>>(getRepositoryToken(DoorState));
    mqttService = module.get<MqttService>(MqttService);
    configService = module.get<ConfigurationService>(ConfigurationService);

    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should subscribe to MQTT door topic', async () => {
      await service.onModuleInit();

      expect(mqttService.onMessage).toHaveBeenCalledWith(
        'sensor/door_sensor/RESULT',
        expect.any(Function)
      );
    });
  });

  describe('handleDoorMessage - Parser Tests', () => {
    let handleDoorMessageSpy: jest.SpyInstance;

    beforeEach(() => {
      handleDoorMessageSpy = jest.spyOn(service as any, 'processDoorStateChange');
      handleDoorMessageSpy.mockImplementation(() => Promise.resolve());
    });

    it('should parse valid message with action ON', () => {
      const payload = Buffer.from('{"Switch1": {"Action": "ON"}}');

      (service as any).handleDoorMessage('test-topic', payload);

      expect(handleDoorMessageSpy).toHaveBeenCalledWith(false);
    });

    it('should parse valid message with action OFF', () => {
      const payload = Buffer.from('{"Switch1": {"Action": "OFF"}}');

      (service as any).handleDoorMessage('test-topic', payload);

      expect(handleDoorMessageSpy).toHaveBeenCalledWith(true);
    });

    it('should handle invalid JSON gracefully', () => {
      const payload = Buffer.from('invalid json');

      (service as any).handleDoorMessage('test-topic', payload);

      expect(handleDoorMessageSpy).not.toHaveBeenCalled();
    });

    it('should handle missing Switch1 property', () => {
      const payload = Buffer.from('{"OtherProperty": {"Action": "ON"}}');

      (service as any).handleDoorMessage('test-topic', payload);

      expect(handleDoorMessageSpy).not.toHaveBeenCalled();
    });

    it('should handle missing Action property', () => {
      const payload = Buffer.from('{"Switch1": {"Status": "ON"}}');

      (service as any).handleDoorMessage('test-topic', payload);

      expect(handleDoorMessageSpy).not.toHaveBeenCalled();
    });
  });

  describe('processDoorStateChange - State Logic Tests', () => {
    beforeEach(() => {
      mockDoorStateRepository.create.mockImplementation((data) => ({ ...data, id: 1 }));
      mockDoorStateRepository.save.mockImplementation((data) => Promise.resolve({ ...data, id: 1 }));
      mockDoorStateRepository.update.mockImplementation(() => Promise.resolve());
    });

    it('should detect door opening', async () => {
      (service as any).currentState = { isOpen: false };

      await (service as any).processDoorStateChange(true);

      expect(mockDoorStateRepository.create).toHaveBeenCalledWith({
        isOpen: true,
        timestamp: expect.any(Date),
      });
      expect(mockDoorStateRepository.save).toHaveBeenCalled();
      expect((service as any).currentState.isOpen).toBe(true);
      expect((service as any).currentState.openedAt).toBeInstanceOf(Date);
      expect((service as any).currentState.lastDoorStateId).toBe(1);
    });

    it('should detect door closing', async () => {
      const openedAt = new Date(Date.now() - 5000); // 5 seconds ago
      (service as any).currentState = {
        isOpen: true,
        openedAt,
        lastDoorStateId: 1,
      };

      await (service as any).processDoorStateChange(false);

      expect(mockDoorStateRepository.update).toHaveBeenCalledWith(1, {
        durationSeconds: expect.any(Number),
      });
      expect(mockDoorStateRepository.create).toHaveBeenCalledWith({
        isOpen: false,
        timestamp: expect.any(Date),
      });
      expect((service as any).currentState.isOpen).toBe(false);
      expect((service as any).currentState.openedAt).toBeUndefined();
      expect((service as any).currentState.lastDoorStateId).toBeUndefined();
    });

    it('should ignore duplicate messages', async () => {
      (service as any).currentState = { isOpen: true };

      await (service as any).processDoorStateChange(true);

      expect(mockDoorStateRepository.create).not.toHaveBeenCalled();
      expect(mockDoorStateRepository.save).not.toHaveBeenCalled();
    });

    it('should handle first message at startup', async () => {
      (service as any).currentState = { isOpen: false };

      await (service as any).processDoorStateChange(true);

      expect(mockDoorStateRepository.create).toHaveBeenCalledWith({
        isOpen: true,
        timestamp: expect.any(Date),
      });
      expect((service as any).currentState.isOpen).toBe(true);
    });
  });

  describe('calculateAndUpdateDuration - Duration Tests', () => {
    beforeEach(() => {
      mockDoorStateRepository.update.mockImplementation(() => Promise.resolve());
    });

    it('should calculate correct duration', async () => {
      const openedAt = new Date(Date.now() - 5000); // 5 seconds ago
      const closedAt = new Date();
      (service as any).currentState = {
        isOpen: true,
        openedAt,
        lastDoorStateId: 1,
      };

      await (service as any).calculateAndUpdateDuration(closedAt);

      expect(mockDoorStateRepository.update).toHaveBeenCalledWith(1, {
        durationSeconds: expect.any(Number),
      });

      const call = mockDoorStateRepository.update.mock.calls[0];
      const durationSeconds = call[1].durationSeconds;
      expect(durationSeconds).toBeGreaterThanOrEqual(4);
      expect(durationSeconds).toBeLessThanOrEqual(6);
    });

    it('should handle closing without previous opening', async () => {
      (service as any).currentState = {
        isOpen: false,
        openedAt: undefined,
        lastDoorStateId: undefined,
      };

      await (service as any).calculateAndUpdateDuration(new Date());

      expect(mockDoorStateRepository.update).not.toHaveBeenCalled();
    });

    it('should reset state after closing', async () => {
      const openedAt = new Date(Date.now() - 1000);
      (service as any).currentState = {
        isOpen: true,
        openedAt,
        lastDoorStateId: 1,
      };

      await (service as any).handleDoorClosing(new Date());

      expect((service as any).currentState.isOpen).toBe(false);
      expect((service as any).currentState.openedAt).toBeUndefined();
      expect((service as any).currentState.lastDoorStateId).toBeUndefined();
    });
  });

  describe('Database Persistence Tests', () => {
    it('should create DoorState on opening', async () => {
      mockDoorStateRepository.save.mockResolvedValue({ id: 1 });
      (service as any).currentState = { isOpen: false };

      await (service as any).handleDoorOpening(new Date());

      expect(mockDoorStateRepository.create).toHaveBeenCalledWith({
        isOpen: true,
        timestamp: expect.any(Date),
      });
      expect(mockDoorStateRepository.save).toHaveBeenCalled();
    });

    it('should update duration on closing', async () => {
      const openedAt = new Date(Date.now() - 3000);
      (service as any).currentState = {
        isOpen: true,
        openedAt,
        lastDoorStateId: 1,
      };

      await (service as any).handleDoorClosing(new Date());

      expect(mockDoorStateRepository.update).toHaveBeenCalledWith(1, {
        durationSeconds: expect.any(Number),
      });
    });

    it('should create new DoorState on closing', async () => {
      (service as any).currentState = {
        isOpen: true,
        openedAt: new Date(),
        lastDoorStateId: 1,
      };

      await (service as any).handleDoorClosing(new Date());

      expect(mockDoorStateRepository.create).toHaveBeenCalledWith({
        isOpen: false,
        timestamp: expect.any(Date),
      });
    });

    it('should handle database errors gracefully', async () => {
      mockDoorStateRepository.save.mockRejectedValue(new Error('DB Error'));
      (service as any).currentState = { isOpen: false };

      await expect((service as any).processDoorStateChange(true)).resolves.not.toThrow();
    });
  });

  describe('End-to-End Scenarios', () => {
    beforeEach(() => {
      mockDoorStateRepository.create.mockImplementation((data) => ({ ...data }));
      mockDoorStateRepository.save.mockImplementation((data) => Promise.resolve({ ...data, id: Date.now() }));
      mockDoorStateRepository.update.mockImplementation(() => Promise.resolve());
    });

    it('should handle complete door cycle', async () => {
      // Initial state: door closed
      (service as any).currentState = { isOpen: false };

      // Door opens
      const openPayload = Buffer.from('{"Switch1": {"Action": "OFF"}}');
      (service as any).handleDoorMessage('test-topic', openPayload);
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for async processing

      expect((service as any).currentState.isOpen).toBe(true);
      expect(mockDoorStateRepository.save).toHaveBeenCalledTimes(1);

      // Duplicate message should be ignored
      (service as any).handleDoorMessage('test-topic', openPayload);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockDoorStateRepository.save).toHaveBeenCalledTimes(1); // Still only 1 call

      // Door closes
      const closePayload = Buffer.from('{"Switch1": {"Action": "ON"}}');
      (service as any).handleDoorMessage('test-topic', closePayload);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect((service as any).currentState.isOpen).toBe(false);
      expect(mockDoorStateRepository.update).toHaveBeenCalledTimes(1);
      expect(mockDoorStateRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should handle startup with door already closed', async () => {
      // Service starts with default state (door closed)
      // When receiving a "closed" message, no state change occurs
      const closePayload = Buffer.from('{"Switch1": {"Action": "ON"}}');
      (service as any).handleDoorMessage('test-topic', closePayload);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect((service as any).currentState.isOpen).toBe(false);
      expect(mockDoorStateRepository.save).not.toHaveBeenCalled(); // No change, no save
      expect(mockDoorStateRepository.update).not.toHaveBeenCalled();
    });
  });
});