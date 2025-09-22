import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as AuthApi from "../services/api/auth";

/** Minimal user identity kept in client state. */
type User = { id: string; name: string; email: string };

/** Value exposed by AuthContext with login/logout helpers. */
interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider bootstraps auth from localStorage on mount and exposes
 * `login`/`logout` functions. Use `useAuth()` to consume the context.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const existingToken = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");
    if (existingToken && userData) {
      try {
        setToken(existingToken);
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await AuthApi.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem("user_data", JSON.stringify(res.user));
  }, []);

  const logout = useCallback(() => {
    AuthApi.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem("user_data");
  }, []);

  const value = useMemo(
    () => ({ user, token, login, logout }),
    [user, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Hook to access the auth context. Must be used within AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
