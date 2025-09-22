import { request } from "./client";

/** Alerts API response with pagination and summary stats. */
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

/** Fetch alerts with optional query parameters. Currently returns empty stub. */
export function getAlerts(
  params: Record<string, string | number | boolean> = {}
): Promise<AlertsResponse> {
  return Promise.resolve({
    alerts: [],
    pagination: { current_page: 1, last_page: 1, per_page: 100, total: 0 },
    stats: { unacknowledged: 0, critical: 0 },
  });
}
