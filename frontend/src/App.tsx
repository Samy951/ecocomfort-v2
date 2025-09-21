import { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AuthWrapper from "./components/AuthWrapper";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import webSocketService from "./services/websocket";
import apiService from "./services/api";
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

  const handleAuthSuccess = useCallback(
    (token: string, user: { id: string; name: string; email: string }) => {
      apiService.setAuthToken(token);
      setCurrentUser({
        id: user.id,
        name: user.name,
        points: 0, // Default points
        level: 1, // Default level
        organizationId: "1", // Default organization ID
      });
      // Reload user profile and gamification data after successful login
      fetchUserProfileAndGamification();
    },
    []
  );

  const handleLogout = useCallback(() => {
    apiService.logout();
    setCurrentUser(null);
    setIsConnected(false);
    setGamification(null);
  }, []);

  const fetchUserProfileAndGamification = useCallback(async () => {
    try {
      // Try to fetch user profile to validate token
      const userData = await apiService.getUserProfile();

      setCurrentUser({
        id: userData.id,
        name: userData.name,
        points: (userData as any).points || 0,
        level: 1, // Default level as number
        organizationId: (userData as any).organization_id || "1",
      });

      // Try to fetch gamification data
      try {
        const gamificationData = await apiService.getGamificationData();
        setGamification({
          current_level: 1, // Convert string level to number
          next_level: 2, // Default next level
          total_points:
            gamificationData.points || (userData as any).points || 0,
          points_for_current: 0,
          points_for_next: 100,
          points_to_next: 100,
          progress_percent: 0,
          is_max_level: false,
        });
      } catch (gamificationError) {
        console.warn("Failed to fetch gamification data:", gamificationError);
        // Set default gamification data
        setGamification({
          current_level: 1, // Default level as number
          next_level: 2,
          total_points: (userData as any).points || 0,
          points_for_current: 0,
          points_for_next: 100,
          points_to_next: 100,
          progress_percent: 0,
          is_max_level: false,
        });
      }

      // Initialize WebSocket with user data
      webSocketService.initializeUser(
        userData.id,
        (userData as any).organization_id || "1"
      );

      // Subscribe to connection events
      const unsubscribeConnected = webSocketService.on("connected", () => {
        setIsConnected(true);
      });

      const unsubscribeDisconnected = webSocketService.on(
        "disconnected",
        () => {
          setIsConnected(false);
        }
      );

      return () => {
        unsubscribeConnected();
        unsubscribeDisconnected();
      };
    } catch (error) {
      console.error("Authentication failed:", error);
      apiService.clearAuthToken();
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("auth_token")) {
      fetchUserProfileAndGamification();
    }
  }, [fetchUserProfileAndGamification]);

  if (!currentUser) {
    return <AuthWrapper onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <Router>
      <Layout
        isConnected={isConnected}
        userPoints={currentUser.points}
        userLevel={currentUser.level}
        onLogout={handleLogout}
      >
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
      </Layout>
    </Router>
  );
}

export default App;
