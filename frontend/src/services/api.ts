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

    // Normalize backend snake_case to frontend SensorStatus[]
    const normalizedSensors: SensorStatus[] = [];
    const backendSensors: any[] = raw?.sensors || [];
    for (const s of backendSensors) {
      const isOnline: boolean = !!s?.is_online;
      const lastUpdateIso: string | undefined = s?.data?.timestamp;
      const lastUpdate: Date | null = lastUpdateIso
        ? new Date(lastUpdateIso)
        : null;

      // temperature entry
      if (typeof s?.data?.temperature === "number") {
        normalizedSensors.push({
          sensorId: s.sensor_id || s.sensorId || "unknown",
          type: "temperature",
          value: s.data.temperature,
          lastUpdate,
          isOnline,
        });
      }
      // humidity entry
      if (typeof s?.data?.humidity === "number") {
        normalizedSensors.push({
          sensorId: s.sensor_id || s.sensorId || "unknown",
          type: "humidity",
          value: s.data.humidity,
          lastUpdate,
          isOnline,
        });
      }
    }

    const response: CurrentSensorsResponse = {
      doorOpen: !!raw?.doorOpen,
      averageTemperature: raw?.averageTemperature ?? null,
      averageHumidity: raw?.averageHumidity ?? null,
      sensors: normalizedSensors,
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

  // Room Details
  async getRoomDetails(roomId: string): Promise<{
    id: string;
    name: string;
    sensors: SensorStatus[];
    energy_data: {
      total_energy_loss_kwh: number;
      total_cost: number;
    };
  }> {
    return this.makeRequest(`/dashboard/room/${encodeURIComponent(roomId)}`);
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

  // Acknowledge alert
  async acknowledgeAlert(
    eventId: string
  ): Promise<ApiResponse<{ acknowledged: boolean }>> {
    return this.makeRequest<ApiResponse<{ acknowledged: boolean }>>(
      `/dashboard/alerts/${encodeURIComponent(eventId)}/acknowledge`,
      {
        method: "POST",
      }
    );
  }

  // Gamification data
  async getGamificationData(): Promise<{
    level: number;
    points: number;
    badges: string[];
    achievements: Record<string, unknown>;
  }> {
    const prefix = this.getEndpointPrefix();
    // TODO: Implémenter l'endpoint de gamification dans le backend
    // Pour l'instant, retourner une erreur pour éviter les données factices
    throw new Error("Gamification endpoint not implemented yet");
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
      user: { id: string; name: string; email: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    return {
      token: response.access_token,
      user: response.user,
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

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest<{ status: string }>("/health");
      return true;
    } catch {
      return false;
    }
  }

  // Calibration methods
  async getCalibrationStatus(sensorId: string): Promise<{
    success: boolean;
    sensor_id: string;
    calibrated: boolean;
    current_values?: {
      x: number;
      y: number;
      z: number;
    } | null;
    message?: string;
  }> {
    return this.makeRequest<{
      success: boolean;
      sensor_id: string;
      calibrated: boolean;
      current_values?: {
        x: number;
        y: number;
        z: number;
      } | null;
      message?: string;
    }>(`/sensors/${encodeURIComponent(sensorId)}/calibration`);
  }

  async checkSensorStability(sensorId: string): Promise<{
    stable: boolean;
    current_values?: {
      x: number;
      y: number;
      z: number;
    } | null;
    stability_metrics?: {
      variance_x: number;
      variance_y: number;
      variance_z: number;
      overall_stability: number;
      sample_count: number;
      observation_period: number;
    };
    ready_for_calibration: boolean;
    reason?: string;
  }> {
    return this.makeRequest<{
      stable: boolean;
      current_values?: {
        x: number;
        y: number;
        z: number;
      } | null;
      stability_metrics?: {
        variance_x: number;
        variance_y: number;
        variance_z: number;
        overall_stability: number;
        sample_count: number;
        observation_period: number;
      };
      ready_for_calibration: boolean;
      reason?: string;
    }>(`/sensors/${encodeURIComponent(sensorId)}/stability`);
  }

  async calibrateDoorPosition(
    sensorId: string,
    options: {
      type: "closed_position";
      confirm: boolean;
      override_existing?: boolean;
    } = { type: "closed_position", confirm: true }
  ): Promise<{
    success: boolean;
    message: string;
    calibration?: {
      closed_reference: {
        x: number;
        y: number;
        z: number;
      };
      confidence: number;
      data_stability: number;
      timestamp: string;
    };
    previous_calibration?: {
      exists: boolean;
      previous_position: {
        x: number;
        y: number;
        z: number;
      };
    };
    error?: string;
  }> {
    return this.makeRequest<{
      success: boolean;
      message: string;
      calibration?: {
        closed_reference: {
          x: number;
          y: number;
          z: number;
        };
        confidence: number;
        data_stability: number;
        timestamp: string;
      };
      previous_calibration?: {
        exists: boolean;
        previous_position: {
          x: number;
          y: number;
          z: number;
        };
      };
      error?: string;
    }>(`/sensors/${encodeURIComponent(sensorId)}/calibrate/door`, {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  async resetCalibration(
    sensorId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const body = reason ? JSON.stringify({ reason }) : undefined;
    return this.makeRequest<{ success: boolean; message: string }>(
      `/sensors/${encodeURIComponent(sensorId)}/calibration`,
      {
        method: "DELETE",
        body,
      }
    );
  }

  async validatePosition(sensorId: string): Promise<{
    valid: boolean;
    message: string;
  }> {
    return this.makeRequest(
      `/sensors/${encodeURIComponent(sensorId)}/validate-position`,
      {
        method: "POST",
      }
    );
  }

  async getCalibrationHistory(
    sensorId: string,
    params: {
      limit?: number;
      from?: string;
      to?: string;
    } = {}
  ): Promise<{
    success: boolean;
    sensor_id: string;
    history: Array<{
      id: number;
      type: string;
      closed_reference: {
        x: number;
        y: number;
        z: number;
      };
      confidence: number;
      calibrated_at: string;
      calibrated_by: {
        id: number;
        name: string;
      };
      replaced_previous: boolean;
    }>;
    pagination: {
      current_page: number;
      total_pages: number;
      total_records: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.from) queryParams.append("from", params.from);
    if (params.to) queryParams.append("to", params.to);

    const endpoint = `/sensors/${encodeURIComponent(
      sensorId
    )}/calibration/history${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    return this.makeRequest(endpoint);
  }

  // Door State Confirmation methods
  async confirmDoorState(
    sensorId: string,
    state: "closed" | "opened",
    notes?: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      confirmed_state: string;
      previous_state: string;
      points_awarded: number;
      confirmation_id: string;
    };
  }> {
    return this.makeRequest(
      `/sensors/${encodeURIComponent(sensorId)}/confirm-door-state`,
      {
        method: "POST",
        body: JSON.stringify({
          state,
          notes: notes || undefined,
        }),
      }
    );
  }

  async getDoorStateConfirmationHistory(sensorId: string): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      confirmed_state: string;
      previous_state: string;
      previous_certainty: "CERTAIN" | "PROBABLE" | "UNCERTAIN";
      sensor_position: {
        x: number;
        y: number;
        z: number;
      };
      confidence_before: number | null;
      user_notes: string | null;
      created_at: string;
      user: {
        id: string;
        name: string;
      };
    }>;
  }> {
    return this.makeRequest(
      `/sensors/${encodeURIComponent(sensorId)}/confirmation-history`
    );
  }

  // Events/Alerts methods
  async getEvents(
    params: {
      page?: number;
      limit?: number;
      severity?: "info" | "warning" | "critical";
      type?: string;
      acknowledged?: boolean;
      room_id?: string;
      sensor_id?: string;
      start_date?: string;
      end_date?: string;
    } = {}
  ): Promise<EventsResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.severity) queryParams.append("severity", params.severity);
    if (params.type) queryParams.append("type", params.type);
    if (params.acknowledged !== undefined)
      queryParams.append("acknowledged", params.acknowledged.toString());
    if (params.room_id) queryParams.append("room_id", params.room_id);
    if (params.sensor_id) queryParams.append("sensor_id", params.sensor_id);
    if (params.start_date) queryParams.append("start_date", params.start_date);
    if (params.end_date) queryParams.append("end_date", params.end_date);

    const endpoint = `/events${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    return this.makeRequest<EventsResponse>(endpoint);
  }

  // Normalized history events for UI
  async getHistoryEvents(params: Parameters<ApiService["getEvents"]>[0] = {}) {
    try {
      const data = await this.getEvents(params);
      const events = (data.events || []).map((e) => ({
        id: e.id,
        type: e.type,
        // map severity: info->low, warning->medium, critical->critical
        severity:
          e.severity === "info"
            ? "low"
            : e.severity === "warning"
            ? "medium"
            : "critical",
        message: e.message,
        cost_impact: e.cost_impact,
        acknowledged: e.acknowledged,
        timestamp: e.created_at,
        created_at: e.created_at,
        sensor: e.sensor?.name,
        room: e.room?.name,
      }));
      return events;
    } catch {
      // Fallback: no events if endpoint missing
      return [] as Array<{
        id: string;
        type: string;
        severity: "low" | "medium" | "high" | "critical";
        message: string;
        cost_impact?: number;
        acknowledged?: boolean;
        timestamp?: string;
        created_at?: string;
        sensor?: string;
        room?: string;
      }>;
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
