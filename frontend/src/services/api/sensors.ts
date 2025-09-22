import { request } from "./client";

/** Runtime status of a single sensor. */
export interface SensorStatus {
  sensorId: string;
  type: "temperature" | "humidity" | "pressure";
  value: number | null;
  lastUpdate: Date | null;
  isOnline: boolean;
}

/** Current snapshot returned by `/dashboard/sensors`. */
export interface CurrentSensorsResponse {
  doorOpen: boolean;
  averageTemperature: number | null;
  averageHumidity: number | null;
  sensors: SensorStatus[];
  timestamp: Date;
}

/**
 * Fetch current sensor snapshot with optional cache-bypass.
 */
export async function getSensorData(params?: {
  bypassCache?: boolean;
  forceUnique?: number;
}): Promise<CurrentSensorsResponse> {
  const base = `/dashboard/sensors`;
  const url =
    params?.bypassCache || params?.forceUnique
      ? `${base}?t=${params.forceUnique || Date.now()}`
      : base;
  const raw = await request<any>(url);
  return normalizeCurrentSensorsResponse(raw);
}

/** Fetch historical readings for a specific sensor. */
export function getSensorHistory(
  sensorId: string,
  query?: Record<string, string>
): Promise<any> {
  const search = new URLSearchParams(query || {}).toString();
  return request(`/sensors/${sensorId}/history${search ? `?${search}` : ""}`);
}

/** List sensors with optional filtering. */
export function getSensors(query?: Record<string, string>) {
  const search = new URLSearchParams(query || {}).toString();
  return request<any>(`/sensors${search ? `?${search}` : ""}`);
}

/** Acknowledge a dashboard alert related to sensors. (stubbed) */
export function acknowledgeAlert(eventId: string): Promise<any> {
  return Promise.resolve({ acknowledged: false });
}

/** Calibrate the door position for a given sensor. (stubbed) */
export function calibrateDoorPosition(
  sensorId: string,
  body: any
): Promise<any> {
  return Promise.resolve({ success: false, message: "Calibration non prise en charge" });
}

/** Reset calibration for a sensor, optionally providing a reason. (stubbed) */
export function resetCalibration(
  sensorId: string,
  reason?: string
): Promise<any> {
  return Promise.resolve({ success: false });
}

/** Get current calibration status for a sensor. (stubbed) */
export function getCalibrationStatus(sensorId: string): Promise<any> {
  return Promise.resolve({ success: false });
}

/** Perform a stability check for a sensor before calibration. (stubbed) */
export function checkSensorStability(sensorId: string): Promise<any> {
  return Promise.resolve({ stable: false, reason: "Non supporté côté backend" });
}

/** Validate the detected position after calibration. (stubbed) */
export function validatePosition(sensorId: string): Promise<any> {
  return Promise.resolve({ valid: false, message: "Non supporté côté backend" });
}

/** Fetch door state confirmation history entries. (stubbed) */
export function getDoorStateConfirmationHistory(
  sensorId: string
): Promise<{ success: boolean; data: any[] }> {
  return Promise.resolve({ success: true, data: [] });
}

/** Normalize backend payload: snake_case -> camelCase and parse dates. */
function normalizeCurrentSensorsResponse(raw: any): CurrentSensorsResponse {
  return {
    doorOpen: raw?.door_open ?? raw?.doorOpen ?? false,
    averageTemperature:
      raw?.average_temperature ?? raw?.averageTemperature ?? null,
    averageHumidity: raw?.average_humidity ?? raw?.averageHumidity ?? null,
    sensors: (raw?.sensors ?? []).map((s: any) => ({
      sensorId: s.sensor_id ?? s.sensorId,
      type: s.type,
      value: s.value ?? null,
      lastUpdate: s.last_update
        ? new Date(s.last_update)
        : s.lastUpdate
        ? new Date(s.lastUpdate)
        : null,
      isOnline: s.is_online ?? s.isOnline ?? false,
    })),
    timestamp: raw?.timestamp ? new Date(raw.timestamp) : new Date(),
  };
}
