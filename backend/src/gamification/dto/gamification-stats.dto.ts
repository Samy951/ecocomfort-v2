export interface GamificationStatsDto {
  userId: number;
  points: number;
  level: string;
  dailyStreak: number;
  quickCloseCount: number;
  badges: BadgeDto[];
  monthlyStats: MonthlyStatsDto;
}

export interface BadgeDto {
  type: string;
  earnedAt: Date;
}

export interface MonthlyStatsDto {
  energyLossWatts: number;
  costEuros: number;
  avgDailyOpenTimeMinutes: number;
}