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
      // Essayer de récupérer les données de gamification du backend
      const gamificationData = await apiService.getGamificationData();
      setGamification({
        current_level: gamificationData.level || 1,
        next_level: (gamificationData.level || 1) + 1,
        total_points: gamificationData.points || 0,
        points_for_current: 0, // TODO: Ajouter au backend
        points_for_next: 100, // TODO: Ajouter au backend
        points_to_next: 100, // TODO: Ajouter au backend
        progress_percent: 0, // TODO: Ajouter au backend
        is_max_level: false, // TODO: Ajouter au backend
      });
    } catch (gamificationError) {
      // Silencieux - endpoint pas encore implémenté
      setGamification(null);
    }
  }, []);

  const handleAuthSuccess = useCallback(
    (token: string, user: { id: string; name: string; email: string }) => {
      apiService.setAuthToken(token);
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
    apiService.logout();
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
          apiService.setAuthToken(token);
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
