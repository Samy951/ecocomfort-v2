import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { UserLevel } from '../shared/enums/user-level.enum';
import { BadgeType } from '../shared/enums/badge-type.enum';

describe('GamificationController', () => {
  let controller: GamificationController;
  let gamificationService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamificationController],
      providers: [
        {
          provide: GamificationService,
          useValue: {
            getGamificationStats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GamificationController>(GamificationController);
    gamificationService = module.get(GamificationService);
  });

  describe('getCurrentUserStats', () => {
    it('should return stats for bronze user', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockStats = {
        userId: 1,
        points: 50,
        level: UserLevel.BRONZE,
        dailyStreak: 3,
        quickCloseCount: 5,
        badges: [],
        monthlyStats: {
          energyLossWatts: 120.5,
          costEuros: 2.4,
          avgDailyOpenTimeMinutes: 45.2,
        },
      };

      gamificationService.getGamificationStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getCurrentUserStats(mockUser);

      // Assert
      expect(result).toEqual(mockStats);
      expect(gamificationService.getGamificationStats).toHaveBeenCalledWith(1);
    });

    it('should return stats for silver user with badges', async () => {
      // Arrange
      const mockUser = { id: 2 };
      const mockStats = {
        userId: 2,
        points: 250,
        level: UserLevel.SILVER,
        dailyStreak: 7,
        quickCloseCount: 15,
        badges: [
          {
            type: BadgeType.FIRST_WEEK,
            earnedAt: new Date('2025-09-15'),
          },
          {
            type: BadgeType.QUICK_CLOSE,
            earnedAt: new Date('2025-09-20'),
          },
        ],
        monthlyStats: {
          energyLossWatts: 80.2,
          costEuros: 1.6,
          avgDailyOpenTimeMinutes: 30.5,
        },
      };

      gamificationService.getGamificationStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getCurrentUserStats(mockUser);

      // Assert
      expect(result).toEqual(mockStats);
      expect(result.badges).toHaveLength(2);
      expect(result.level).toBe(UserLevel.SILVER);
      expect(result.points).toBe(250);
    });

    it('should return stats for gold user', async () => {
      // Arrange
      const mockUser = { id: 3 };
      const mockStats = {
        userId: 3,
        points: 750,
        level: UserLevel.GOLD,
        dailyStreak: 14,
        quickCloseCount: 50,
        badges: [
          {
            type: BadgeType.ENERGY_SAVER,
            earnedAt: new Date('2025-09-10'),
          },
          {
            type: BadgeType.WINTER_GUARDIAN,
            earnedAt: new Date('2025-09-18'),
          },
        ],
        monthlyStats: {
          energyLossWatts: 45.8,
          costEuros: 0.9,
          avgDailyOpenTimeMinutes: 15.3,
        },
      };

      gamificationService.getGamificationStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getCurrentUserStats(mockUser);

      // Assert
      expect(result.level).toBe(UserLevel.GOLD);
      expect(result.points).toBe(750);
      expect(result.quickCloseCount).toBe(50);
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      // Arrange
      const mockUser = { id: 999 };
      gamificationService.getGamificationStats.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(controller.getCurrentUserStats(mockUser)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND)
      );
    });

    it('should throw INTERNAL_SERVER_ERROR for other errors', async () => {
      // Arrange
      const mockUser = { id: 1 };
      gamificationService.getGamificationStats.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.getCurrentUserStats(mockUser)).rejects.toThrow(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });
  });

  describe('getStats', () => {
    it('should return stats for valid user ID', async () => {
      // Arrange
      const userId = '1';
      const mockStats = {
        userId: 1,
        points: 150,
        level: UserLevel.SILVER,
        dailyStreak: 5,
        quickCloseCount: 12,
        badges: [],
        monthlyStats: {
          energyLossWatts: 95.3,
          costEuros: 1.9,
          avgDailyOpenTimeMinutes: 38.7,
        },
      };

      gamificationService.getGamificationStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getStats(userId);

      // Assert
      expect(result).toEqual(mockStats);
      expect(gamificationService.getGamificationStats).toHaveBeenCalledWith(1);
    });

    it('should throw BAD_REQUEST for invalid user ID', async () => {
      // Arrange
      const invalidUserId = 'abc';

      // Act & Assert
      await expect(controller.getStats(invalidUserId)).rejects.toThrow(
        new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST)
      );
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      // Arrange
      const userId = '999';
      gamificationService.getGamificationStats.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(controller.getStats(userId)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND)
      );
    });
  });
});