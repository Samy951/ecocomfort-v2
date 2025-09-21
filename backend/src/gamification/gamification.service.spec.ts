import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamificationService } from './gamification.service';
import { User } from '../shared/entities/user.entity';
import { UserBadge } from '../shared/entities/user-badge.entity';
import { DoorState } from '../shared/entities/door-state.entity';
import { EnergyMetric } from '../shared/entities/energy-metric.entity';
import { EcoWebSocketGateway } from '../websocket/websocket.gateway';
import { BadgeType } from '../shared/enums/badge-type.enum';
import { UserLevel } from '../shared/enums/user-level.enum';
import { mockService, MockType } from '../shared/testing/mockers';

describe('GamificationService', () => {
  let service: GamificationService;
  let userRepository: jest.Mocked<Repository<User>>;
  let userBadgeRepository: jest.Mocked<Repository<UserBadge>>;
  let doorStateRepository: jest.Mocked<Repository<DoorState>>;
  let energyMetricRepository: jest.Mocked<Repository<EnergyMetric>>;
  let webSocketGateway: jest.Mocked<EcoWebSocketGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        mockService(getRepositoryToken(User), {
          findOne: jest.fn(),
          save: jest.fn(),
          find: jest.fn(),
        }),
        mockService(getRepositoryToken(UserBadge), {
          create: jest.fn(),
          save: jest.fn(),
          find: jest.fn(),
        }),
        mockService(getRepositoryToken(DoorState), {
          find: jest.fn(),
          createQueryBuilder: jest.fn(),
        }),
        mockService(getRepositoryToken(EnergyMetric), {
          find: jest.fn(),
        }),
        mockService(EcoWebSocketGateway, {
          emitPointsAwarded: jest.fn(),
          emitBadgeAwarded: jest.fn(),
          emitLevelUp: jest.fn(),
        }),
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    userRepository = module.get(getRepositoryToken(User));
    userBadgeRepository = module.get(getRepositoryToken(UserBadge));
    doorStateRepository = module.get(getRepositoryToken(DoorState));
    energyMetricRepository = module.get(getRepositoryToken(EnergyMetric));
    webSocketGateway = module.get<jest.Mocked<EcoWebSocketGateway>>(EcoWebSocketGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleDoorClosed', () => {
    it('should award 5 points for quick close (< 10 seconds)', async () => {
      const mockUser = {
        id: 1,
        points: 0,
        level: UserLevel.BRONZE,
        dailyStreak: 0,
        quickCloseCount: 0,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      // Mock non-optimal day (>= 5 minutes total) so we only get quick close points
      doorStateRepository.find.mockResolvedValue([
        { durationSeconds: 300 } // 5 minutes = non-optimal
      ] as DoorState[]);

      await service.handleDoorClosed(1, 8); // < 10 seconds

      expect(mockUser.points).toBe(5);
      expect(mockUser.quickCloseCount).toBe(1);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(webSocketGateway.emitPointsAwarded).toHaveBeenCalled();
    });

    it('should not award points for normal close (>= 10 seconds)', async () => {
      const mockUser = {
        id: 1,
        points: 0,
        level: UserLevel.BRONZE,
        dailyStreak: 0,
        quickCloseCount: 0,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      // Mock non-optimal day (>= 5 minutes total)
      doorStateRepository.find.mockResolvedValue([
        { durationSeconds: 300 } // 5 minutes = non-optimal
      ] as DoorState[]);

      await service.handleDoorClosed(1, 15); // >= 10 seconds

      expect(mockUser.quickCloseCount).toBe(0);
      expect(mockUser.points).toBe(0); // No points awarded
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should award 20 points for daily optimal (< 5 minutes total)', async () => {
      const mockUser = {
        id: 1,
        points: 0,
        level: UserLevel.BRONZE,
        dailyStreak: 0,
        quickCloseCount: 0,
      } as User;

      const mockDoorStates = [
        { durationSeconds: 120 }, // 2 minutes
        { durationSeconds: 60 },  // 1 minute
      ] as DoorState[];

      userRepository.findOne.mockResolvedValue(mockUser);
      doorStateRepository.find.mockResolvedValue(mockDoorStates);
      userRepository.save.mockResolvedValue(mockUser);

      await service.handleDoorClosed(1, 60); // Total: 4 minutes < 5 minutes

      expect(mockUser.points).toBe(20);
      expect(mockUser.dailyStreak).toBe(1);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should reset streak for non-optimal day (>= 5 minutes total)', async () => {
      const mockUser = {
        id: 1,
        points: 0,
        level: UserLevel.BRONZE,
        dailyStreak: 3,
        quickCloseCount: 0,
      } as User;

      const mockDoorStates = [
        { durationSeconds: 240 }, // 4 minutes
        { durationSeconds: 120 }, // 2 minutes
      ] as DoorState[];

      userRepository.findOne.mockResolvedValue(mockUser);
      doorStateRepository.find.mockResolvedValue(mockDoorStates);

      await service.handleDoorClosed(1, 120); // Total: 8 minutes >= 5 minutes

      expect(mockUser.dailyStreak).toBe(0);
    });

    it('should award 100 bonus points for 7-day streak', async () => {
      const mockUser = {
        id: 1,
        points: 100,
        level: UserLevel.SILVER,
        dailyStreak: 6, // Will become 7 after optimal day
        quickCloseCount: 0,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      doorStateRepository.find.mockResolvedValue([]); // No openings today = optimal
      userRepository.save.mockResolvedValue(mockUser);

      await service.handleDoorClosed(1, 60);

      expect(mockUser.points).toBe(220); // 100 + 20 (optimal) + 100 (streak bonus)
      expect(mockUser.dailyStreak).toBe(7);
    });

    it('should update user level when points increase', async () => {
      const mockUser = {
        id: 1,
        points: 95,
        level: UserLevel.BRONZE,
        dailyStreak: 0,
        quickCloseCount: 0,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      doorStateRepository.find.mockResolvedValue([]);
      userRepository.save.mockResolvedValue(mockUser);

      await service.handleDoorClosed(1, 8); // +5 points -> 100 total

      expect(mockUser.level).toBe(UserLevel.SILVER);
      expect(webSocketGateway.emitLevelUp).toHaveBeenCalledWith(1, UserLevel.BRONZE, UserLevel.SILVER);
    });
  });

  describe('checkAndAwardBadges', () => {
    it('should award FIRST_WEEK badge after 7 days', async () => {
      const oneWeekAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const mockUser = {
        id: 1,
        createdAt: oneWeekAgo,
        badges: [],
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      userBadgeRepository.create.mockReturnValue({} as UserBadge);
      userBadgeRepository.save.mockResolvedValue({} as UserBadge);
      energyMetricRepository.find.mockResolvedValue([]); // Empty array for ENERGY_SAVER check
      doorStateRepository.find.mockResolvedValue([]); // Empty array for NIGHT_WATCH check
      doorStateRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      await service['checkAndAwardBadges'](1);

      expect(userBadgeRepository.save).toHaveBeenCalled();
      expect(webSocketGateway.emitBadgeAwarded).toHaveBeenCalledWith(
        1,
        BadgeType.FIRST_WEEK,
        'Première semaine complète'
      );
    });

    it('should award QUICK_CLOSE badge after 10 quick closes', async () => {
      const mockUser = {
        id: 1,
        quickCloseCount: 10,
        badges: [],
        createdAt: new Date(), // Add required field
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      userBadgeRepository.create.mockReturnValue({} as UserBadge);
      userBadgeRepository.save.mockResolvedValue({} as UserBadge);
      energyMetricRepository.find.mockResolvedValue([]); // Empty array for ENERGY_SAVER check
      doorStateRepository.find.mockResolvedValue([]); // Empty array for NIGHT_WATCH check
      doorStateRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      await service['checkAndAwardBadges'](1);

      expect(userBadgeRepository.save).toHaveBeenCalled();
      expect(webSocketGateway.emitBadgeAwarded).toHaveBeenCalledWith(
        1,
        BadgeType.QUICK_CLOSE,
        '10 fermetures rapides'
      );
    });

    it('should not award duplicate badges', async () => {
      const now = new Date();
      const mockUser = {
        id: 1,
        quickCloseCount: 5, // Less than 10 so QUICK_CLOSE shouldn't be awarded
        badges: [{ badgeType: BadgeType.QUICK_CLOSE }], // Already has QUICK_CLOSE
        createdAt: now, // Recent creation so FIRST_WEEK shouldn't be awarded
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      energyMetricRepository.find.mockResolvedValue([
        { costEuros: 15 } // High cost so ENERGY_SAVER shouldn't be awarded
      ] as EnergyMetric[]);
      doorStateRepository.find.mockResolvedValue([
        { timestamp: now } // Opening found so NIGHT_WATCH shouldn't be awarded
      ] as DoorState[]);
      doorStateRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null), // No cold day optimal for WINTER_GUARDIAN
      });

      await service['checkAndAwardBadges'](1);

      expect(userBadgeRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getGamificationStats', () => {
    it('should return complete user stats', async () => {
      const mockUser = {
        id: 1,
        points: 150,
        level: UserLevel.SILVER,
        dailyStreak: 3,
        quickCloseCount: 7,
        badges: [
          { badgeType: BadgeType.FIRST_WEEK, earnedAt: new Date() },
        ],
      } as User;

      const mockEnergyMetrics = [
        { costEuros: 2.5, energyLossWatts: 100 },
        { costEuros: 1.8, energyLossWatts: 75 },
      ] as EnergyMetric[];

      const mockDoorStates = [
        { durationSeconds: 120 },
        { durationSeconds: 180 },
      ] as DoorState[];

      userRepository.findOne.mockResolvedValue(mockUser);
      energyMetricRepository.find.mockResolvedValue(mockEnergyMetrics);
      doorStateRepository.find.mockResolvedValue(mockDoorStates);

      const result = await service.getGamificationStats(1);

      expect(result).toEqual({
        userId: 1,
        points: 150,
        level: UserLevel.SILVER,
        dailyStreak: 3,
        quickCloseCount: 7,
        badges: [
          {
            type: BadgeType.FIRST_WEEK,
            earnedAt: expect.any(Date),
          },
        ],
        monthlyStats: {
          energyLossWatts: 175,
          costEuros: 4.3,
          avgDailyOpenTimeMinutes: expect.any(Number),
        },
      });
    });

    it('should throw error for non-existent user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getGamificationStats(999)).rejects.toThrow('User not found');
    });
  });

  describe('calculateLevel', () => {
    it('should return correct level for different point thresholds', () => {
      expect(service['calculateLevel'](0)).toBe(UserLevel.BRONZE);
      expect(service['calculateLevel'](99)).toBe(UserLevel.BRONZE);
      expect(service['calculateLevel'](100)).toBe(UserLevel.SILVER);
      expect(service['calculateLevel'](499)).toBe(UserLevel.SILVER);
      expect(service['calculateLevel'](500)).toBe(UserLevel.GOLD);
      expect(service['calculateLevel'](1000)).toBe(UserLevel.GOLD);
    });
  });
});