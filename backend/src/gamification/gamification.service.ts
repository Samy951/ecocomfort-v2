import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../shared/entities/user.entity';
import { UserBadge } from '../shared/entities/user-badge.entity';
import { DoorState } from '../shared/entities/door-state.entity';
import { EnergyMetric } from '../shared/entities/energy-metric.entity';
import { BadgeType } from '../shared/enums/badge-type.enum';
import { UserLevel } from '../shared/enums/user-level.enum';
import { EcoWebSocketGateway } from '../websocket/websocket.gateway';

interface PointsAward {
  points: number;
  reason: string;
}

interface BadgeCheck {
  type: BadgeType;
  criteria: () => Promise<boolean>;
  description: string;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserBadge)
    private userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(DoorState)
    private doorStateRepository: Repository<DoorState>,
    @InjectRepository(EnergyMetric)
    private energyMetricRepository: Repository<EnergyMetric>,
    private webSocketGateway: EcoWebSocketGateway,
  ) {}

  async handleDoorClosed(userId: number, durationSeconds: number): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) return;

      const pointsAwarded: PointsAward[] = [];

      // Fermeture rapide (< 10 secondes)
      if (durationSeconds < 10) {
        pointsAwarded.push({ points: 5, reason: 'Fermeture rapide' });
        user.quickCloseCount += 1;
      }

      // Vérification journée optimale
      const dailyOptimalPoints = await this.checkDailyOptimal(userId);
      if (dailyOptimalPoints) {
        pointsAwarded.push(dailyOptimalPoints);
        user.dailyStreak += 1;
      } else {
        user.dailyStreak = 0;
      }

      // Série hebdomadaire (7 jours consécutifs)
      if (user.dailyStreak === 7) {
        pointsAwarded.push({ points: 100, reason: 'Série de 7 jours optimaux' });
      }

      // Mise à jour points et niveau
      const totalPointsAwarded = pointsAwarded.reduce((sum, award) => sum + award.points, 0);
      if (totalPointsAwarded > 0) {
        const oldLevel = user.level;
        user.points += totalPointsAwarded;
        user.level = this.calculateLevel(user.points);

        await this.userRepository.save(user);

        // Événements WebSocket
        this.webSocketGateway.emitPointsAwarded(userId, pointsAwarded, user.points);

        if (oldLevel !== user.level) {
          this.webSocketGateway.emitLevelUp(userId, oldLevel, user.level);
        }

        this.logger.log(`User ${userId} awarded ${totalPointsAwarded} points: ${pointsAwarded.map(p => p.reason).join(', ')}`);
      }

      // Vérification et attribution badges
      await this.checkAndAwardBadges(userId);

    } catch (error) {
      this.logger.error(`Error handling door closed gamification: ${error.message}`);
    }
  }

  async handleEnergyMetricCreated(userId: number, energyMetricId: number): Promise<void> {
    try {
      await this.checkAndAwardBadges(userId);
    } catch (error) {
      this.logger.error(`Error handling energy metric gamification: ${error.message}`);
    }
  }

  private async checkDailyOptimal(userId: number): Promise<PointsAward | null> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const doorStates = await this.doorStateRepository.find({
      where: {
        timestamp: Between(startOfDay, endOfDay),
        isOpen: true,
      },
    });

    const totalOpenTimeSeconds = doorStates
      .filter(state => state.durationSeconds !== null)
      .reduce((sum, state) => sum + state.durationSeconds, 0);

    if (totalOpenTimeSeconds < 300) { // < 5 minutes
      return { points: 20, reason: 'Journée optimale (< 5 min d\'ouverture)' };
    }

    return null;
  }

  private calculateLevel(points: number): UserLevel {
    if (points >= 500) return UserLevel.GOLD;
    if (points >= 100) return UserLevel.SILVER;
    return UserLevel.BRONZE;
  }

  private async checkAndAwardBadges(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['badges']
    });

    if (!user) return;

    const existingBadgeTypes = user.badges.map(badge => badge.badgeType);

    const badgeChecks: BadgeCheck[] = [
      {
        type: BadgeType.FIRST_WEEK,
        criteria: () => this.checkFirstWeekBadge(user),
        description: 'Première semaine complète'
      },
      {
        type: BadgeType.QUICK_CLOSE,
        criteria: () => this.checkQuickCloseBadge(user),
        description: '10 fermetures rapides'
      },
      {
        type: BadgeType.ENERGY_SAVER,
        criteria: () => this.checkEnergySaverBadge(userId),
        description: 'Économies d\'énergie'
      },
      {
        type: BadgeType.WINTER_GUARDIAN,
        criteria: () => this.checkWinterGuardianBadge(userId),
        description: 'Gardien de l\'hiver'
      },
      {
        type: BadgeType.NIGHT_WATCH,
        criteria: () => this.checkNightWatchBadge(userId),
        description: 'Veilleur de nuit'
      },
      {
        type: BadgeType.PERFECT_DAY,
        criteria: () => this.checkPerfectDayBadge(userId),
        description: 'Journée parfaite'
      }
    ];

    for (const badgeCheck of badgeChecks) {
      if (!existingBadgeTypes.includes(badgeCheck.type)) {
        const shouldAward = await badgeCheck.criteria();
        if (shouldAward) {
          await this.awardBadge(userId, badgeCheck.type, badgeCheck.description);
        }
      }
    }
  }

  private async awardBadge(userId: number, badgeType: BadgeType, description: string): Promise<void> {
    try {
      const badge = this.userBadgeRepository.create({
        userId,
        badgeType,
        earnedAt: new Date(),
      });

      await this.userBadgeRepository.save(badge);

      this.webSocketGateway.emitBadgeAwarded(userId, badgeType, description);
      this.logger.log(`Badge ${badgeType} awarded to user ${userId}: ${description}`);
    } catch (error) {
      this.logger.error(`Error awarding badge ${badgeType} to user ${userId}: ${error.message}`);
    }
  }

  private checkFirstWeekBadge(user: User): Promise<boolean> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return Promise.resolve(user.createdAt < oneWeekAgo);
  }

  private checkQuickCloseBadge(user: User): Promise<boolean> {
    return Promise.resolve(user.quickCloseCount >= 10);
  }

  private async checkEnergySaverBadge(userId: number): Promise<boolean> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const energyMetrics = await this.energyMetricRepository.find({
      relations: ['doorState'],
      where: {
        doorState: {
          timestamp: Between(thirtyDaysAgo, new Date()),
        },
      },
    });

    const totalCost = energyMetrics.reduce((sum, metric) => sum + metric.costEuros, 0);
    return totalCost < 10;
  }

  private async checkWinterGuardianBadge(userId: number): Promise<boolean> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const coldDayOptimal = await this.doorStateRepository
      .createQueryBuilder('doorState')
      .innerJoin('energy_metrics', 'em', 'em.doorStateId = doorState.id')
      .where('doorState.timestamp >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('em.outdoorTemp < 5')
      .andWhere('doorState.isOpen = true')
      .andWhere('doorState.durationSeconds < 300')
      .getOne();

    return !!coldDayOptimal;
  }

  private async checkNightWatchBadge(userId: number): Promise<boolean> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const nightStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 22, 0, 0);
    const nightEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1, 6, 0, 0);

    const nightOpenings = await this.doorStateRepository.find({
      where: {
        timestamp: Between(nightStart, nightEnd),
        isOpen: true,
      },
    });

    return nightOpenings.length === 0;
  }

  private async checkPerfectDayBadge(userId: number): Promise<boolean> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const energyMetrics = await this.energyMetricRepository.find({
      relations: ['doorState'],
      where: {
        doorState: {
          timestamp: Between(startOfDay, endOfDay),
        },
      },
    });

    const totalEnergyLoss = energyMetrics.reduce((sum, metric) => sum + metric.energyLossWatts, 0);
    return totalEnergyLoss === 0;
  }

  async getGamificationStats(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['badges'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calcul statistiques mensuelles
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const energyMetrics = await this.energyMetricRepository.find({
      relations: ['doorState'],
      where: {
        doorState: {
          timestamp: Between(thirtyDaysAgo, new Date()),
        },
      },
    });

    const monthlyCost = energyMetrics.reduce((sum, metric) => sum + metric.costEuros, 0);
    const monthlyEnergyLoss = energyMetrics.reduce((sum, metric) => sum + metric.energyLossWatts, 0);

    // Calcul temps d'ouverture moyen (7 derniers jours)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentDoorStates = await this.doorStateRepository.find({
      where: {
        timestamp: Between(sevenDaysAgo, new Date()),
        isOpen: true,
      },
    });

    const totalOpenTime = recentDoorStates
      .filter(state => state.durationSeconds !== null)
      .reduce((sum, state) => sum + state.durationSeconds, 0);
    const avgDailyOpenTimeMinutes = totalOpenTime / (7 * 60);

    return {
      userId: user.id,
      points: user.points,
      level: user.level,
      dailyStreak: user.dailyStreak,
      quickCloseCount: user.quickCloseCount,
      badges: user.badges.map(badge => ({
        type: badge.badgeType,
        earnedAt: badge.earnedAt,
      })),
      monthlyStats: {
        energyLossWatts: Math.round(monthlyEnergyLoss * 100) / 100,
        costEuros: Math.round(monthlyCost * 100) / 100,
        avgDailyOpenTimeMinutes: Math.round(avgDailyOpenTimeMinutes * 100) / 100,
      },
    };
  }
}