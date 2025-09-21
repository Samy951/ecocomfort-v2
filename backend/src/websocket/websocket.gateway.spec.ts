import { Test, TestingModule } from '@nestjs/testing';
import { EcoWebSocketGateway } from './websocket.gateway';
import { mockService } from '../shared/testing/mockers';
import { Server, Socket } from 'socket.io';
import { BadgeType } from '../shared/enums/badge-type.enum';
import { UserLevel } from '../shared/enums/user-level.enum';

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

  describe('emitPointsAwarded', () => {
    it('should emit points-awarded event with correct payload', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');
      const testDate = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => testDate as any);

      const userId = 1;
      const pointsAwarded = [
        { points: 5, reason: 'Quick close' },
        { points: 10, reason: 'Daily optimal' },
      ];
      const newTotal = 25;

      gateway.emitPointsAwarded(userId, pointsAwarded, newTotal);

      expect(emitSpy).toHaveBeenCalledWith('points-awarded', {
        userId,
        pointsAwarded,
        newTotal,
        timestamp: testDate
      });

      jest.restoreAllMocks();
    });

    it('should handle empty points array', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');
      const testDate = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => testDate as any);

      gateway.emitPointsAwarded(1, [], 0);

      expect(emitSpy).toHaveBeenCalledWith('points-awarded', {
        userId: 1,
        pointsAwarded: [],
        newTotal: 0,
        timestamp: testDate
      });

      jest.restoreAllMocks();
    });

    it('should handle single award', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');
      const testDate = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => testDate as any);

      const singleAward = [{ points: 15, reason: 'Week streak' }];

      gateway.emitPointsAwarded(1, singleAward, 15);

      expect(emitSpy).toHaveBeenCalledWith('points-awarded', {
        userId: 1,
        pointsAwarded: singleAward,
        newTotal: 15,
        timestamp: testDate
      });

      jest.restoreAllMocks();
    });
  });

  describe('emitBadgeAwarded', () => {
    it('should emit badge-awarded event with correct payload for each badge type', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');
      const testDate = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => testDate as any);

      // Test different badge types
      const testCases = [
        { badgeType: BadgeType.FIRST_WEEK, description: 'Complete 7 days' },
        { badgeType: BadgeType.QUICK_CLOSE, description: 'Close door < 10 seconds' },
        { badgeType: BadgeType.ENERGY_SAVER, description: 'Save 10€ in month' },
        { badgeType: BadgeType.WINTER_GUARDIAN, description: 'Performance in cold weather' },
        { badgeType: BadgeType.NIGHT_WATCH, description: 'No night openings' },
        { badgeType: BadgeType.PERFECT_DAY, description: 'Zero energy loss in 24h' },
      ];

      testCases.forEach(({ badgeType, description }) => {
        emitSpy.mockClear();

        gateway.emitBadgeAwarded(1, badgeType, description);

        expect(emitSpy).toHaveBeenCalledWith('badge-awarded', {
          userId: 1,
          badgeType,
          description,
          earnedAt: testDate
        });
      });

      jest.restoreAllMocks();
    });

    it('should handle long descriptions', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');
      const testDate = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => testDate as any);

      const longDescription = 'This is a very long description that might be used for some badges to explain in detail what the user accomplished to earn this particular badge';

      gateway.emitBadgeAwarded(1, BadgeType.ENERGY_SAVER, longDescription);

      expect(emitSpy).toHaveBeenCalledWith('badge-awarded', {
        userId: 1,
        badgeType: BadgeType.ENERGY_SAVER,
        description: longDescription,
        earnedAt: testDate
      });

      jest.restoreAllMocks();
    });
  });

  describe('emitLevelUp', () => {
    it('should emit level-up event with correct payload for all level transitions', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');
      const testDate = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => testDate as any);

      // Test level transitions
      const transitions = [
        { old: UserLevel.BRONZE, new: UserLevel.SILVER },
        { old: UserLevel.SILVER, new: UserLevel.GOLD },
      ];

      transitions.forEach(({ old: oldLevel, new: newLevel }) => {
        emitSpy.mockClear();

        gateway.emitLevelUp(1, oldLevel, newLevel);

        expect(emitSpy).toHaveBeenCalledWith('level-up', {
          userId: 1,
          oldLevel,
          newLevel,
          timestamp: testDate
        });
      });

      jest.restoreAllMocks();
    });

    it('should handle edge case with same level', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');
      const testDate = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => testDate as any);

      gateway.emitLevelUp(1, UserLevel.GOLD, UserLevel.GOLD);

      expect(emitSpy).toHaveBeenCalledWith('level-up', {
        userId: 1,
        oldLevel: UserLevel.GOLD,
        newLevel: UserLevel.GOLD,
        timestamp: testDate
      });

      jest.restoreAllMocks();
    });
  });

  describe('robustness and error handling', () => {
    it('should throw error when server not initialized', () => {
      gateway.server = undefined as any;

      expect(() => gateway.emit('test-event', { data: 'test' })).toThrow('Cannot read properties of undefined');
    });

    it('should handle null payloads gracefully', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');

      expect(() => gateway.emitPointsAwarded(1, null as any, 0)).not.toThrow();
      expect(() => gateway.emitBadgeAwarded(1, null as any, null as any)).not.toThrow();
      expect(() => gateway.emitLevelUp(1, null as any, null as any)).not.toThrow();
    });

    it('should handle undefined payloads gracefully', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');

      expect(() => gateway.emitPointsAwarded(1, undefined as any, undefined as any)).not.toThrow();
      expect(() => gateway.emitBadgeAwarded(1, undefined as any, undefined as any)).not.toThrow();
      expect(() => gateway.emitLevelUp(1, undefined as any, undefined as any)).not.toThrow();
    });

    it('should verify timestamps in all events', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');
      const beforeTest = Date.now();

      gateway.emitDoorStateChanged(true);
      gateway.emitSensorDataUpdated(20.0, 45.0);
      gateway.emitPointsAwarded(1, [{ points: 5, reason: 'test' }], 5);
      gateway.emitBadgeAwarded(1, BadgeType.QUICK_CLOSE, 'test badge');
      gateway.emitLevelUp(1, UserLevel.BRONZE, UserLevel.SILVER);

      const afterTest = Date.now();

      // Verify all calls have timestamps within our test window
      emitSpy.mock.calls.forEach(call => {
        const payload = call[1];
        const timestamp = payload.timestamp || payload.earnedAt;
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTest);
        expect(timestamp.getTime()).toBeLessThanOrEqual(afterTest);
      });
    });

    it('should handle multiple simultaneous emissions', () => {
      const emitSpy = jest.spyOn(gateway, 'emit');

      // Simulate rapid emissions
      gateway.emitDoorStateChanged(true);
      gateway.emitDoorStateChanged(false);
      gateway.emitPointsAwarded(1, [{ points: 5, reason: 'test' }], 5);
      gateway.emitBadgeAwarded(1, BadgeType.QUICK_CLOSE, 'Fast badge');

      expect(emitSpy).toHaveBeenCalledTimes(4);
      expect(emitSpy).toHaveBeenNthCalledWith(1, 'door-state-changed', expect.any(Object));
      expect(emitSpy).toHaveBeenNthCalledWith(2, 'door-state-changed', expect.any(Object));
      expect(emitSpy).toHaveBeenNthCalledWith(3, 'points-awarded', expect.any(Object));
      expect(emitSpy).toHaveBeenNthCalledWith(4, 'badge-awarded', expect.any(Object));
    });
  });
});