export const API_BASE_PATH = "/api";

export const BACKEND_HTTP_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";

export const WS_URL = import.meta.env.VITE_WS_URL || `${BACKEND_HTTP_ORIGIN}`;

export const isDevelopment = import.meta.env.DEV === true;
// Silent fallback in dev when VITE_WS_URL is missing; no console warning
