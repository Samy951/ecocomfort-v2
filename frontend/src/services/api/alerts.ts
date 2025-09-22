import { request } from "./client";
import type { AlertsResponse } from "../../types/api";

/**
 * Fetch alerts with optional query parameters.
 * NOTE: Backend does not expose an alerts endpoint yet; we return a stable stub
 * to keep the UI functional without 404s.
 */
export function getAlerts(
  params: Record<string, string | number | boolean> = {}
): Promise<AlertsResponse> {
  // Dev-time: return empty stable structure. Swap to real request when backend is ready.
  return Promise.resolve({
    alerts: [],
    pagination: { current_page: 1, last_page: 1, per_page: 100, total: 0 },
    stats: { unacknowledged: 0, critical: 0 },
  });
}
