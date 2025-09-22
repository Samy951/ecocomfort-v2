import { API_BASE_PATH } from "../../config";

/**
 * In-memory auth token synchronized with localStorage.
 * Always call setAuthToken to update it so request headers stay in sync.
 */
let authToken: string | null = null;

/**
 * Set or clear the current JWT token and persist it under `auth_token`.
 *
 * @param token - JWT string or null to clear
 */
export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem("auth_token", token);
  else localStorage.removeItem("auth_token");
}

/**
 * Perform a JSON API request against the backend using the shared base path.
 *
 * - Adds `Authorization: Bearer <token>` automatically when a token is set
 * - On 401: clears the token and emits `auth:token-expired`
 * - For 204 or non-JSON responses: returns undefined
 *
 * @typeParam T - Expected JSON body type
 * @param endpoint - API path relative to API_BASE_PATH
 * @param options - Fetch options merged with sensible defaults
 * @returns Parsed JSON body as T or undefined
 * @throws Error when response.ok is false
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_PATH}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  } as HeadersInit;

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    setAuthToken(null);
    window.dispatchEvent(new CustomEvent("auth:token-expired"));
    throw new Error(
      `Authentication failed: ${response.status} ${response.statusText}`
    );
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (
    response.status === 204 ||
    contentType.indexOf("application/json") === -1
  ) {
    // @ts-expect-error allow void for 204 endpoints
    return undefined;
  }
  return response.json();
}

/** Initialize in-memory token from localStorage on module load. */
const existing = localStorage.getItem("auth_token");
if (existing) {
  authToken = existing;
}
