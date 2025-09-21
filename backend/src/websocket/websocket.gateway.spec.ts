import { Test, TestingModule } from '@nestjs/testing';
import { EcoWebSocketGateway } from './websocket.gateway';
import { mockService } from '../shared/testing/mockers';
import { Server, Socket } from 'socket.io';

describe('EcoWebSocketGateway', () => {
  let gateway: EcoWebSocketGateway;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
    } as any;

    mockSocket = {
      id: 'test-socket-id',
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [EcoWebSocketGateway],
    }).compile();

    gateway = module.get<EcoWebSocketGateway>(EcoWebSocketGateway);
    gateway.server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.handleConnection(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith('Client connected: test-socket-id');
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.handleDisconnect(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith('Client disconnected: test-socket-id');
    });
  });

  describe('emit', () => {
    it('should emit event and log', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');
      const testEvent = 'test-event';
      const testData = { test: 'data' };

      gateway.emit(testEvent, testData);

      expect(mockServer.emit).toHaveBeenCalledWith(testEvent, testData);
      expect(loggerSpy).toHaveBeenCalledWith('Emitted test-event event');
    });
  });

  describe('emitDoorStateChanged', () => {
    it('should emit door-state-changed event with correct payload', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');
      const testDate = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => testDate as any);

      gateway.emitDoorStateChanged(true);

      expect(emitSpy).toHaveBeenCalledWith('door-state-changed', {
        isOpen: true,
        timestamp: testDate
      });

      gateway.emitDoorStateChanged(false);

      expect(emitSpy).toHaveBeenCalledWith('door-state-changed', {
        isOpen: false,
        timestamp: testDate
      });

      jest.restoreAllMocks();
    });
  });

  describe('emitSensorDataUpdated', () => {
    it('should emit sensor-data-updated event with correct payload', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');
      const testDate = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => testDate as any);

      const avgTemp = 21.5;
      const avgHumidity = 45.2;

      gateway.emitSensorDataUpdated(avgTemp, avgHumidity);

      expect(emitSpy).toHaveBeenCalledWith('sensor-data-updated', {
        averageTemperature: avgTemp,
        averageHumidity: avgHumidity,
        timestamp: testDate
      });

      jest.restoreAllMocks();
    });
  });
});