import { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AuthWrapper from "./components/AuthWrapper";
import ErrorBoundary from "./components/ErrorBoundary";
import { lazy, Suspense } from "react";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
import webSocketService from "./services/websocket";
import * as DashboardApi from "./services/api/dashboard";
import { logout as authLogout } from "./services/api/auth";
import type { GamificationLevel } from "./types";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [gamification, setGamification] = useState<GamificationLevel | null>(
    null
  );
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    points: number;
    level: number;
    organizationId: string;
  } | null>(null);

  const fetchGamificationData = useCallback(async () => {
    // Endpoint non implémenté côté backend pour l'instant
    setGamification(null);
  }, []);

  const handleAuthSuccess = useCallback(
    (token: string, user: { id: string; name: string; email: string }) => {
      localStorage.setItem("auth_token", token); // Persist token
      localStorage.setItem("user_data", JSON.stringify(user)); // Persist user data
      setCurrentUser({
        id: user.id,
        name: user.name,
        points: 0, // TODO: Ajouter au backend
        level: 1, // TODO: Ajouter au backend
        organizationId: "", // TODO: Ajouter au backend
      });

      // Initialiser l'utilisateur avec le WebSocket
      webSocketService.initializeUser(user.id, ""); // TODO: Ajouter organizationId au backend

      // Try to fetch gamification data only (no need to fetch user profile again)
      fetchGamificationData();
    },
    [fetchGamificationData]
  );

  const handleLogout = useCallback(() => {
    authLogout();
    setCurrentUser(null);
    setIsConnected(false);
    setGamification(null);
  }, []);

  useEffect(() => {
    // Check if user is already authenticated on page load
    const checkAuthOnLoad = () => {
      const token = localStorage.getItem("auth_token");
      const userData = localStorage.getItem("user_data");

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUser({
            id: user.id,
            name: user.name,
            points: 0, // TODO: Ajouter au backend
            level: 1, // TODO: Ajouter au backend
            organizationId: "", // TODO: Ajouter au backend
          });

          // Initialiser l'utilisateur avec le WebSocket
          webSocketService.initializeUser(user.id, ""); // TODO: Ajouter organizationId au backend

          // Try to fetch gamification data
          fetchGamificationData();
        } catch (error) {
          console.error("Error parsing user data:", error);
          // Clear invalid data
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
        }
      }
    };

    checkAuthOnLoad();
  }, [fetchGamificationData]);

  useEffect(() => {
    // Initialize WebSocket connection
    const unsubscribeConnected = webSocketService.on("connected", () => {
      setIsConnected(true);
    });

    const unsubscribeDisconnected = webSocketService.on("disconnected", () => {
      setIsConnected(false);
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
    };
  }, []);

  if (!currentUser) {
    return <AuthWrapper onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Layout
        isConnected={isConnected}
        userPoints={currentUser.points}
        userLevel={currentUser.level}
        onLogout={handleLogout}
      >
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Chargement...</div>}>
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    setIsConnected={setIsConnected}
                    gamification={gamification}
                    currentUser={currentUser}
                  />
                }
              />
              <Route
                path="/profile"
                element={
                  <Profile
                    userPoints={currentUser.points}
                    userLevel={currentUser.level}
                    gamificationLevel={gamification}
                  />
                }
              />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Layout>
    </Router>
  );
}

export default App;
