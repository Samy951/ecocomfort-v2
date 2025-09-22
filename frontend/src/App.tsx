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

  const fetchGamificationData = useCallback(async () => {
    try {
      // Try to fetch gamification data
      const gamificationData = await apiService.getGamificationData();
      setGamification({
        current_level: 1, // Convert string level to number
        next_level: 2, // Default next level
        total_points: gamificationData.points || 0,
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
        total_points: 0,
        points_for_current: 0,
        points_for_next: 100,
        points_to_next: 100,
        progress_percent: 0,
        is_max_level: false,
      });
    }
  }, []);

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
      // Try to fetch gamification data only (no need to fetch user profile again)
      fetchGamificationData();
    },
    [fetchGamificationData]
  );

  const handleLogout = useCallback(() => {
    apiService.logout();
    setCurrentUser(null);
    setIsConnected(false);
    setGamification(null);
  }, []);

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
