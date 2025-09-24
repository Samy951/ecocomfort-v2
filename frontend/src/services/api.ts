import type { SensorData } from "../types";

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

interface Organization {
  name: string;
  surface_m2: number;
  target_percent: number;
}

interface Infrastructure {
  total_buildings: number;
  total_rooms: number;
  total_sensors: number;
  active_sensors: number;
  sensor_uptime: number;
}

interface Energy {
  total_energy_loss_kwh: number;
  total_cost: number;
  rooms_with_open_doors: number;
}

interface AlertStats {
  unacknowledged: number;
  critical: number;
}

interface EventData {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  cost_impact: number;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: {
    id: string;
    name: string;
  } | null;
  data: Record<string, unknown>;
  sensor: {
    id: string;
    name: string;
    position: string;
  };
  room: {
    id: string;
    name: string;
    building_name: string;
    floor: number;
  };
  created_at: string;
}

interface EventsResponse {
  events: EventData[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  statistics: {
    total_events: number;
    unacknowledged_events: number;
    critical_events: number;
    total_cost_impact: number;
  };
}

interface DashboardOverview {
  organization: Organization;
  infrastructure: Infrastructure;
  energy: Energy;
  alerts: AlertStats;
}

interface SensorStatus {
  sensorId: string;
  type: "temperature" | "humidity" | "pressure";
  value: number | null;
  lastUpdate: Date | null;
  isOnline: boolean;
}

interface CurrentSensorsResponse {
  doorOpen: boolean;
  averageTemperature: number | null;
  averageHumidity: number | null;
  sensors: SensorStatus[];
  timestamp: Date;
}

interface Alert {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  acknowledged: boolean;
  cost_impact?: number;
  created_at: string;
  room?: {
    name: string;
  };
  sensor?: {
    name: string;
  };
}

interface AlertsResponse {
  alerts: Alert[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  stats: {
    unacknowledged: number;
    critical: number;
  };
}

interface RoomAnalytic {
  room_id: string;
  room_name: string;
  building_name: string;
  energy_loss_kwh: number;
  cost: number;
  events_count: number;
  average_duration: number;
  efficiency_score: number;
  potential_savings: {
    daily_kwh: number;
    yearly_cost: number;
  };
}

interface EnergyAnalytics {
  total_energy_loss_kwh: number;
  total_cost: number;
  room_analytics: RoomAnalytic[];
  efficiency: {
    target_percent: number;
    actual_percent: number;
    goal_achieved: boolean;
    improvement_needed: number;
  };
}

class ApiService {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    // Always use relative URL in development to leverage Vite proxy
    this.baseURL = "/api";
    try {
      if (typeof window !== "undefined" && "localStorage" in window) {
        this.authToken = localStorage.getItem("auth_token");
      }
    } catch {
      this.authToken = null;
    }
  }

  // Get the appropriate endpoint prefix (always use authenticated endpoints)
  private getEndpointPrefix(): string {
    // Always use authenticated endpoints with real data
    return "";
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        // Force bypass service worker for real-time data
        cache: endpoint.includes("?t=") ? "no-cache" : "default",
      });

      // Handle authentication errors
      if (response.status === 401) {
        console.warn("Token expired or invalid, clearing authentication...");
        this.clearAuthToken();

        // Dispatch custom event to notify the app
        window.dispatchEvent(new CustomEvent("auth:token-expired"));

        throw new Error(
          `Authentication failed: ${response.status} ${response.statusText}`
        );
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Dashboard Overview
  async getDashboardOverview(): Promise<DashboardOverview> {
    const prefix = this.getEndpointPrefix();
    return this.makeRequest<DashboardOverview>(
      `${prefix}/dashboard/energy/daily`
    );
  }

  // Sensor Data
  async getSensorData(options?: {
    bypassCache?: boolean;
    forceUnique?: number;
  }): Promise<CurrentSensorsResponse> {
    const prefix = this.getEndpointPrefix();
    const url = `${prefix}/dashboard/sensors`;

    const raw = await this.makeRequest<any>(
      options?.bypassCache || options?.forceUnique
        ? `${url}?t=${options.forceUnique || Date.now()}`
        : url
    );

    // Backend now returns data in frontend format directly
    const response: CurrentSensorsResponse = {
      doorOpen: !!raw?.doorOpen,
      averageTemperature: raw?.averageTemperature ?? null,
      averageHumidity: raw?.averageHumidity ?? null,
      sensors: raw?.sensors || [],
      timestamp: raw?.timestamp ? new Date(raw.timestamp) : new Date(),
    };

    return response;
  }

  // Alerts
  async getAlerts(
    params: {
      page?: number;
      limit?: number;
      severity?: string;
      acknowledged?: boolean;
    } = {}
  ): Promise<AlertsResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.severity) queryParams.append("severity", params.severity);
    if (params.acknowledged !== undefined)
      queryParams.append("acknowledged", params.acknowledged.toString());

    const prefix = this.getEndpointPrefix();
    const endpoint = `${prefix}/dashboard/alerts${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    return this.makeRequest<AlertsResponse>(endpoint);
  }

  // Energy Analytics
  async getEnergyAnalytics(days: number = 7): Promise<EnergyAnalytics> {
    const prefix = this.getEndpointPrefix();
    return this.makeRequest<EnergyAnalytics>(
      `${prefix}/dashboard/energy/current`
    );
  }

  // Chart Data
  async getChartData(): Promise<any[]> {
    const prefix = this.getEndpointPrefix();
    return this.makeRequest<any[]>(
      `${prefix}/dashboard/energy/chart-data`
    );
  }


  // Sensor History
  async getSensorHistory(
    sensorId: string,
    params: {
      start_date?: string;
      end_date?: string;
      interval?: "1m" | "5m" | "15m" | "1h" | "6h" | "1d";
      metrics?: string[];
    } = {}
  ): Promise<{
    data: Array<{
      timestamp: string;
      temperature?: number;
      humidity?: number;
      energy_loss_watts?: number;
      door_state?: boolean;
    }>;
    sensor: SensorStatus;
  }> {
    const queryParams = new URLSearchParams();

    if (params.start_date) queryParams.append("start_date", params.start_date);
    if (params.end_date) queryParams.append("end_date", params.end_date);
    if (params.interval) queryParams.append("interval", params.interval);
    if (params.metrics)
      params.metrics.forEach((metric) =>
        queryParams.append("metrics[]", metric)
      );

    const endpoint = `/sensors/${encodeURIComponent(sensorId)}/history${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    return this.makeRequest(endpoint);
  }

  // Get all sensors
  async getSensors(
    params: {
      page?: number;
      limit?: number;
      room_id?: string;
      status?: "active" | "inactive" | "offline";
    } = {}
  ): Promise<{
    sensors: SensorStatus[];
    pagination: {
      current_page: number;
      total_pages: number;
      total: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.room_id) queryParams.append("room_id", params.room_id);
    if (params.status) queryParams.append("status", params.status);

    const endpoint = `/sensors${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    return this.makeRequest(endpoint);
  }


  // Gamification data
  async getGamificationData(): Promise<{
    level: number;
    points: number;
    badges: string[];
    achievements: {
      badges: string[];
      dailyStreak: number;
      quickCloseCount: number;
      monthlyStats: {
        energyLossWatts: number;
        costEuros: number;
        avgDailyOpenTimeMinutes: number;
      };
    };
  }> {
    const prefix = this.getEndpointPrefix();
    try {
      const response = await this.makeRequest<{
        userId: number;
        points: number;
        level: string;
        dailyStreak: number;
        quickCloseCount: number;
        badges: Array<{
          type: string;
          earnedAt: string;
        }>;
        monthlyStats: {
          energyLossWatts: number;
          costEuros: number;
          avgDailyOpenTimeMinutes: number;
        };
      }>(`${prefix}/gamification/stats`);

      // Convert level string to number for compatibility
      const levelMap = { BRONZE: 1, SILVER: 2, GOLD: 3 };
      const levelNumber = levelMap[response.level as keyof typeof levelMap] || 1;

      return {
        level: levelNumber,
        points: response.points,
        badges: response.badges.map(badge => badge.type),
        achievements: {
          badges: response.badges.map(badge => badge.type),
          dailyStreak: response.dailyStreak,
          quickCloseCount: response.quickCloseCount,
          monthlyStats: response.monthlyStats,
        },
      };
    } catch (error) {
      // Show toast notification for missing endpoint
      console.warn("Système de gamification bientôt disponible");
      // Return default values to avoid breaking the UI
      return {
        level: 1,
        points: 0,
        badges: [],
        achievements: {
          badges: [],
          dailyStreak: 0,
          quickCloseCount: 0,
          monthlyStats: {
            energyLossWatts: 0,
            costEuros: 0,
            avgDailyOpenTimeMinutes: 0,
          },
        },
      };
    }
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.authToken = token;
    try {
      if (typeof window !== "undefined" && "localStorage" in window) {
        localStorage.setItem("auth_token", token);
      }
    } catch {
      // ignore storage errors
    }
  }

  // Clear authentication token
  clearAuthToken() {
    this.authToken = null;
    try {
      if (typeof window !== "undefined" && "localStorage" in window) {
        localStorage.removeItem("auth_token");
      }
    } catch {
      // ignore storage errors
    }
  }

  // Authentication methods
  async login(
    email: string,
    password: string
  ): Promise<{
    token: string;
    user: { id: string; name: string; email: string };
  }> {
    const response = await this.makeRequest<{
      access_token: string;
      user: { id: number; name: string; email: string; level?: string; points?: number };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    return {
      token: response.access_token,
      user: {
        id: String(response.user.id), // Convert number to string for frontend compatibility
        name: response.user.name,
        email: response.user.email,
      },
    };
  }

  async register(
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
    organization_name: string
  ): Promise<{
    token: string;
    user: { id: string; name: string; email: string };
  }> {
    const response = await this.makeRequest<{
      access_token: string;
      user: { id: string; name: string; email: string };
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation,
        organization_name,
      }),
    });

    return {
      token: response.access_token,
      user: response.user,
    };
  }

  async logout(): Promise<void> {
    // Backend doesn't have logout endpoint, just clear local auth
    this.clearAuthToken();
  }

  // Door usage stats
  async getDoorUsageStats(): Promise<Array<{
    day: string;
    opens: number;
    closes: number;
    avgDuration: number;
  }>> {
    const prefix = this.getEndpointPrefix();
    return this.makeRequest<Array<{
      day: string;
      opens: number;
      closes: number;
      avgDuration: number;
    }>>(`${prefix}/dashboard/stats/door-usage`);
  }

  // Savings stats
  async getSavingsStats(): Promise<{
    thisMonth: number;
    lastMonth: number;
    total: number;
    quickCloseCount: number;
    estimatedYearly: number;
  }> {
    const prefix = this.getEndpointPrefix();
    return this.makeRequest<{
      thisMonth: number;
      lastMonth: number;
      total: number;
      quickCloseCount: number;
      estimatedYearly: number;
    }>(`${prefix}/dashboard/stats/savings`);
  }

  // Weekly activity
  async getWeeklyActivity(): Promise<Array<{
    date: string;
    points: number;
    energy_saved: number;
  }>> {
    const prefix = this.getEndpointPrefix();
    return this.makeRequest<Array<{
      date: string;
      points: number;
      energy_saved: number;
    }>>(`${prefix}/dashboard/activity/weekly`);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest<{ status: string }>("/health");
      return true;
    } catch {
      return false;
    }
  }


}

// Create singleton instance
const apiService = new ApiService();
export default apiService;
export type {
  DashboardOverview,
  CurrentSensorsResponse,
  SensorStatus,
  AlertsResponse,
  Alert,
  EnergyAnalytics,
  RoomAnalytic,
  EventsResponse,
  EventData,
};
