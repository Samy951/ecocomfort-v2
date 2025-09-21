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
