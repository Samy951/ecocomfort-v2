import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Navigation from "./Navigation";

interface LayoutProps {
  children: ReactNode;
  isConnected: boolean;
  userPoints: number;
  userLevel: number;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  isConnected,
  userPoints,
  userLevel,
  onLogout,
}) => {
  const [darkMode, setDarkMode] = useState(true);
  const [unreadNotifications] = useState(0);

  useEffect(() => {
    // Load dark mode preference
    const savedTheme = localStorage.getItem("ecocomfort-theme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
    }

    // Apply theme to document
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("ecocomfort-theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  const handleNotificationsClick = () => {
    // TODO: Implémenter le système de notifications
    console.log("Notifications clicked - système pas encore implémenté");
    // Pour l'instant, juste un log
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      {/* Background */}
      <div className="fixed inset-0 bg-main-white dark:bg-main-black" />

      {/* Navigation */}
      <Navigation
        isConnected={isConnected}
        userPoints={userPoints}
        userLevel={userLevel}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        unreadNotifications={unreadNotifications}
        onLogout={onLogout}
        onNotificationsClick={handleNotificationsClick}
      />

      {/* Main Content */}
      <main className="relative z-10 lg:ml-64">
        {/* Mobile Header Padding */}
        <div className="lg:hidden h-16" />

        {/* Content */}
        <div className="container section">{children}</div>

        {/* Mobile Bottom Navigation Padding */}
        <div className="lg:hidden h-20" />
      </main>

      {/* Notification System */}
      {/* <NotificationSystem /> */}
    </div>
  );
};

export default Layout;
