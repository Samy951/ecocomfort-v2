// Types simplifiés pour EcoComfort

// Types de base
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface SensorData {
  timestamp: string;
  temperature?: number;
  humidity?: number;
  door_state?: boolean;
  energy_loss_watts?: number;
}

export interface Sensor {
  sensor_id: string;
  name: string;
  room: {
    name: string;
    building_name: string;
  };
  data?: SensorData;
  is_online: boolean;
  has_usable_data: boolean;
}

// Gamification
export interface GamificationLevel {
  current_level: number;
  next_level: number;
  total_points: number;
  points_for_current: number;
  points_for_next: number;
  points_to_next: number;
  progress_percent: number;
  is_max_level: boolean;
  achievements?: {
    badges: string[];
    dailyStreak: number;
    quickCloseCount: number;
    monthlyStats: {
      energyLossWatts: number;
      costEuros: number;
      avgDailyOpenTimeMinutes: number;
    };
  };
}

// Dashboard
export interface DashboardData {
  sensors: Sensor[];
  averageTemperature: number;
  doorOpen: boolean;
  currentLossWatts: number;
  currentCostPerHour: number;
}

export interface DailyReport {
  totals: {
    totalLossWatts: number;
    totalCostEuros: number;
    totalCo2Grams: number;
    totalDoorOpenings: number;
    totalDoorOpenDuration: number;
  };
  hourlyMetrics: Array<{
    hour: number;
    totalLossWatts: number;
    totalCostEuros: number;
    doorOpenings: number;
  }>;
}

// Gamification Stats
export interface GamificationStats {
  level: number;
  points: number;
  badges: Array<{
    name: string;
    description: string;
  }>;
}

// API Response
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

// WebSocket Event Types
export interface DoorStateChangedData {
  sensor_id: string;
  door_state: boolean;
  timestamp: string;
  room_name: string;
}

export interface SensorDataUpdatedData {
  sensor_id: string;
  data: SensorData;
  timestamp: string;
}

export interface PointsAwardedData {
  userId: number;
  pointsAwarded: Array<{points: number, reason: string}>;
  newTotal: number;
  timestamp: Date;
}

export interface BadgeAwardedData {
  userId: number;
  badgeType: string;
  description: string;
  earnedAt: Date;
}

export interface LevelUpData {
  userId: number;
  oldLevel: string;
  newLevel: string;
  timestamp: Date;
}

export type WebSocketEventData =
  | DoorStateChangedData
  | SensorDataUpdatedData
  | PointsAwardedData
  | BadgeAwardedData
  | LevelUpData
  | { socketId: string }
  | { reason: string };

// Error Types
export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

// History Event Types
export interface HistoryEvent {
  id: string;
  type:
    | "door_open"
    | "door_close"
    | "sensor_alert"
    | "energy_saving"
    | "gamification";
  timestamp: string;
  description: string;
  sensor_id?: string;
  room_name?: string;
  points_awarded?: number;
  energy_saved?: number;
  created_at?: string;
  severity?: "low" | "medium" | "high" | "critical";
  message?: string;
  sensor?: string;
  room?: string;
  cost_impact?: number;
}

// Settings Types
export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    door_alerts: boolean;
    energy_alerts: boolean;
  };
  display: {
    temperature_unit: "celsius" | "fahrenheit";
    language: string;
    theme: "light" | "dark" | "auto";
  };
  privacy: {
    data_sharing: boolean;
    analytics: boolean;
  };
}

export type SettingValue = boolean | string | number;
