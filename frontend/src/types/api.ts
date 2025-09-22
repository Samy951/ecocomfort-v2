export interface EnergyDailyMetric {
  hour: number;
  totalLossWatts: number;
  totalCostEuros?: number;
}

export interface EnergyDailyResponse {
  date: string;
  hourlyMetrics: EnergyDailyMetric[];
}

export interface AlertsResponse {
  alerts: any[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  stats: { unacknowledged: number; critical: number };
}
