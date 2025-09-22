import { request } from "./client";
import type { EnergyDailyResponse } from "../../types/api";

/** Dashboard overview aggregate returned by the backend. */
export interface DashboardOverview {
  organization: {
    name: string;
    surface_m2: number;
    target_percent: number;
  };
  infrastructure: {
    total_buildings: number;
    total_rooms: number;
    total_sensors: number;
    active_sensors: number;
    sensor_uptime: number;
  };
  energy: {
    total_energy_loss_kwh: number;
    total_cost: number;
    rooms_with_open_doors: number;
  };
  alerts: {
    unacknowledged: number;
    critical: number;
  };
}

/**
 * The backend does not currently expose a `/dashboard/overview` route.
 * Return sensible defaults locally to keep the UI stable without 404s.
 */
export function getDashboardOverview(): Promise<DashboardOverview> {
  return Promise.resolve({
    organization: { name: "EcoComfort", surface_m2: 0, target_percent: 0 },
    infrastructure: {
      total_buildings: 0,
      total_rooms: 0,
      total_sensors: 0,
      active_sensors: 0,
      sensor_uptime: 0,
    },
    energy: { total_energy_loss_kwh: 0, total_cost: 0, rooms_with_open_doors: 0 },
    alerts: { unacknowledged: 0, critical: 0 },
  });
}

/** Fetch current energy analytics used by the live chart. */
export function getEnergyAnalytics(days: number = 1) {
  return request<any>(`/dashboard/energy/current`);
}

/** Fetch daily energy series used by the area chart. */
export function getEnergyDaily() {
  return request<EnergyDailyResponse>(`/dashboard/energy/daily`);
}
