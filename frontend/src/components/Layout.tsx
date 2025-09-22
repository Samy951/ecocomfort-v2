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
    // Load dark mode preference once
    const savedTheme = localStorage.getItem("ecocomfort-theme");
    if (savedTheme) {
      const preferDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldDark =
        savedTheme === "dark" || (savedTheme === "auto" && preferDark);
      setDarkMode(shouldDark);
      document.documentElement.classList.toggle("dark", shouldDark);
    } else {
      document.documentElement.classList.toggle("dark", darkMode);
    }

    // Listen to theme change events from settings
    const onThemeChanged = (e: any) => {
      const t = e?.detail as string | undefined;
      const preferDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldDark = t === "dark" || (t === "auto" && preferDark);
      setDarkMode(shouldDark);
      document.documentElement.classList.toggle("dark", shouldDark);
    };
    window.addEventListener("theme:changed", onThemeChanged as EventListener);
    return () =>
      window.removeEventListener(
        "theme:changed",
        onThemeChanged as EventListener
      );
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    const theme = newMode ? "dark" : "light";
    localStorage.setItem("ecocomfort-theme", theme);
    document.documentElement.classList.toggle("dark", newMode);
    // Broadcast change so settings and other parts stay in sync
    window.dispatchEvent(new CustomEvent("theme:changed", { detail: theme }));
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
