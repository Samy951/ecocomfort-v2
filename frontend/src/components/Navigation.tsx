import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Settings,
  User,
  Menu,
  X,
  Wifi,
  WifiOff,
  Bell,
  Trophy,
  Zap,
  Moon,
  Sun,
  Shield,
  LogOut,
} from "lucide-react";
import { Button, Typography } from "./ui";

interface NavigationProps {
  isConnected: boolean;
  userPoints: number;
  userLevel: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  unreadNotifications?: number;
  onLogout?: () => void;
  onNotificationsClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  isConnected,
  userPoints,
  userLevel,
  darkMode,
  onToggleDarkMode,
  unreadNotifications = 0,
  onLogout,
  onNotificationsClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/profile", icon: User, label: "Profil" },
    { path: "/settings", icon: Settings, label: "Paramètres" },
    { path: "/admin", icon: Shield, label: "Administration" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getLevelColor = (level: number) => {
    if (level >= 50) return "text-grandis-DEFAULT";
    if (level >= 30) return "text-main-green";
    if (level >= 15) return "text-cornflower-DEFAULT";
    return "text-medium-grey";
  };

  const getLevelIcon = (level: number) => {
    if (level >= 50) return "🏆";
    if (level >= 30) return "🥇";
    if (level >= 15) return "🥈";
    return "🥉";
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50">
        <div className="flex flex-col flex-grow bg-main-white dark:bg-main-black border-r border-grey dark:border-dark-grey">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-grey dark:border-dark-grey">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-main-green rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-main-white" />
              </div>
              <Typography variant="h5" className="font-bold">
                EcoComfort
              </Typography>
            </div>
          </div>

          {/* Connection Status */}
          <div className="px-4 py-3 border-b border-grey dark:border-dark-grey">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-main-green" />
              ) : (
                <WifiOff className="w-4 h-4 text-error" />
              )}
              <Typography
                variant="paragraph-small"
                color={isConnected ? "main-green" : "error"}
              >
                {isConnected ? "Connecté" : "Déconnecté"}
              </Typography>
            </div>
          </div>

          {/* User Stats */}
          <div className="px-4 py-3 border-b border-grey dark:border-dark-grey">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className={`w-4 h-4 ${getLevelColor(userLevel)}`} />
                <Typography variant="paragraph-small" color="medium-grey">
                  Niveau {userLevel}
                </Typography>
              </div>
              <Typography
                variant="paragraph-small"
                color="main-green"
                className="font-bold"
              >
                {userPoints} pts
              </Typography>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    active
                      ? "bg-main-green text-main-white"
                      : "text-medium-grey hover:text-main-black dark:hover:text-main-white hover:bg-light-grey dark:hover:bg-dark-grey"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <Typography
                    variant="paragraph-medium"
                    className={active ? "text-main-white" : ""}
                  >
                    {item.label}
                  </Typography>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="px-4 py-4 border-t border-grey dark:border-dark-grey space-y-2">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="small"
              onClick={onToggleDarkMode}
              className="w-full justify-start"
              icon={
                darkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )
              }
            >
              {darkMode ? "Mode clair" : "Mode sombre"}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="small"
              className="w-full justify-start"
              icon={<Bell className="w-4 h-4" />}
              onClick={onNotificationsClick}
            >
              Notifications
              {unreadNotifications > 0 && (
                <span className="ml-auto bg-error text-main-white text-xs rounded-full px-2 py-1">
                  {unreadNotifications}
                </span>
              )}
            </Button>

            {/* Logout */}
            {onLogout && (
              <Button
                variant="ghost"
                size="small"
                onClick={onLogout}
                className="w-full justify-start text-error hover:text-error hover:bg-error/10"
                icon={<LogOut className="w-4 h-4" />}
              >
                Déconnexion
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-main-white dark:bg-main-black border-b border-grey dark:border-dark-grey">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-main-green rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-main-white" />
            </div>
            <Typography variant="h5" className="font-bold">
              EcoComfort
            </Typography>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="small"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            icon={
              isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )
            }
          >
            Menu
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-main-white dark:bg-main-black border-b border-grey dark:border-dark-grey shadow-medium">
            <div className="px-4 py-4 space-y-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-main-green" />
                ) : (
                  <WifiOff className="w-4 h-4 text-error" />
                )}
                <Typography
                  variant="paragraph-small"
                  color={isConnected ? "main-green" : "error"}
                >
                  {isConnected ? "Connecté" : "Déconnecté"}
                </Typography>
              </div>

              {/* User Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className={`w-4 h-4 ${getLevelColor(userLevel)}`} />
                  <Typography variant="paragraph-small" color="medium-grey">
                    Niveau {userLevel}
                  </Typography>
                </div>
                <Typography
                  variant="paragraph-small"
                  color="main-green"
                  className="font-bold"
                >
                  {userPoints} pts
                </Typography>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                        active
                          ? "bg-main-green text-main-white"
                          : "text-medium-grey hover:text-main-black dark:hover:text-main-white hover:bg-light-grey dark:hover:bg-dark-grey"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <Typography
                        variant="paragraph-medium"
                        className={active ? "text-main-white" : ""}
                      >
                        {item.label}
                      </Typography>
                    </Link>
                  );
                })}
              </nav>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-grey dark:border-dark-grey">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={onToggleDarkMode}
                  className="w-full justify-start"
                  icon={
                    darkMode ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )
                  }
                >
                  {darkMode ? "Mode clair" : "Mode sombre"}
                </Button>

                <Button
                  variant="ghost"
                  size="small"
                  className="w-full justify-start"
                  icon={<Bell className="w-4 h-4" />}
                  onClick={onNotificationsClick}
                >
                  Notifications
                  {unreadNotifications > 0 && (
                    <span className="ml-auto bg-error text-main-white text-xs rounded-full px-2 py-1">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>

                {onLogout && (
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={onLogout}
                    className="w-full justify-start text-error hover:text-error hover:bg-error/10"
                    icon={<LogOut className="w-4 h-4" />}
                  >
                    Déconnexion
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navigation;
