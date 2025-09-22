import { request, setAuthToken } from "./client";

/**
 * Authenticate a user and persist the returned JWT.
 *
 * @param email - User email
 * @param password - User password
 * @returns token and minimal user identity
 */
export async function login(
  email: string,
  password: string
): Promise<{
  token: string;
  user: { id: string; name: string; email: string };
}> {
  const response = await request<{
    access_token: string;
    user: { id: string; name: string; email: string };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setAuthToken(response.access_token);
  return { token: response.access_token, user: response.user };
}

/**
 * Register a new user and persist the returned JWT.
 */
export async function register(params: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  organization_name: string;
}): Promise<{
  token: string;
  user: { id: string; name: string; email: string };
}> {
  const response = await request<{
    access_token: string;
    user: { id: string; name: string; email: string };
  }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });

  setAuthToken(response.access_token);
  return { token: response.access_token, user: response.user };
}

/**
 * Clear the current JWT and related local state.
 */
export function logout(): void {
  setAuthToken(null);
}
