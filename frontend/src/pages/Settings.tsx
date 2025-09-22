import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Bell,
  BellOff,
  Moon,
  Sun,
  Globe,
  Thermometer,
  Euro,
  Shield,
  Save,
  RefreshCw,
  CheckCircle,
  Trophy,
  Users,
} from "lucide-react";
import { Card } from "../components/ui";
import type { User, UserSettings, SettingValue, AppError } from "../types";

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      push_enabled: true,
      email_enabled: true,
      critical_only: false,
      quiet_hours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
      },
    },
    display: {
      theme: "dark",
      temperature_unit: "celsius",
      currency: "EUR",
      language: "fr",
    },
    gamification: {
      enabled: true,
      show_leaderboard: true,
      show_notifications: true,
    },
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simuler la sauvegarde
      await new Promise((resolve) => setTimeout(resolve, 1000));
      localStorage.setItem("ecocomfort-settings", JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (category: string, key: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: !(
          prev[category as keyof typeof prev] as Record<string, boolean>
        )[key],
      },
    }));
  };

  const updateSetting = (
    category: string,
    key: string,
    value: SettingValue
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 text-main-black dark:text-main-white">
      {/* Header */}
      <Card variant="glass" padding="lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-info" />
            <div>
              <h1 className="text-3xl font-bold text-main-black dark:text-main-white">
                Paramètres
              </h1>
              <p className="text-main-black/70 dark:text-main-white/70">
                Personnalisez votre expérience EcoComfort
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-main-green text-main-black dark:text-main-white rounded-lg hover:bg-main-green/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? "Sauvegarde..." : saved ? "Sauvegardé" : "Sauvegarder"}
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-success" />
          Notifications
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-info" />
              <div>
                <div className="font-medium text-main-black dark:text-main-white">
                  Notifications push
                </div>
                <div className="text-sm text-main-black/70 dark:text-main-white/70">
                  Recevoir des notifications en temps réel
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleSetting("notifications", "push_enabled")}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.notifications.push_enabled
                  ? "bg-main-green"
                  : "bg-medium-grey"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.notifications.push_enabled
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <BellOff className="w-5 h-5 text-warning" />
              <div>
                <div className="font-medium text-main-black dark:text-main-white">
                  Notifications critiques uniquement
                </div>
                <div className="text-sm text-main-black/70 dark:text-main-white/70">
                  Ne recevoir que les alertes importantes
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleSetting("notifications", "critical_only")}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.notifications.critical_only
                  ? "bg-main-green"
                  : "bg-medium-grey"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.notifications.critical_only
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-medium text-main-black dark:text-main-white">
                  Heures silencieuses
                </div>
                <div className="text-sm text-main-black/70 dark:text-main-white/70">
                  Désactiver les notifications la nuit
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleSetting("notifications", "quiet_hours")}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.notifications.quiet_hours.enabled
                  ? "bg-main-green"
                  : "bg-medium-grey"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.notifications.quiet_hours.enabled
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Display Settings */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-success" />
          Affichage
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-warning" />
              <div>
                <div className="font-medium text-main-black dark:text-main-white">
                  Thème
                </div>
                <div className="text-sm text-main-black/70 dark:text-main-white/70">
                  Mode sombre ou clair
                </div>
              </div>
            </div>
            <select
              value={settings.display.theme}
              onChange={(e) =>
                updateSetting("display", "theme", e.target.value)
              }
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-main-black dark:text-main-white"
            >
              <option value="dark">Sombre</option>
              <option value="light">Clair</option>
              <option value="auto">Automatique</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Thermometer className="w-5 h-5 text-critical" />
              <div>
                <div className="font-medium text-main-black dark:text-main-white">
                  Unité de température
                </div>
                <div className="text-sm text-main-black/70 dark:text-main-white/70">
                  Celsius ou Fahrenheit
                </div>
              </div>
            </div>
            <select
              value={settings.display.temperature_unit}
              onChange={(e) =>
                updateSetting("display", "temperature_unit", e.target.value)
              }
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-main-black dark:text-main-white"
            >
              <option value="celsius">Celsius (°C)</option>
              <option value="fahrenheit">Fahrenheit (°F)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Euro className="w-5 h-5 text-success" />
              <div>
                <div className="font-medium text-main-black dark:text-main-white">
                  Devise
                </div>
                <div className="text-sm text-main-black/70 dark:text-main-white/70">
                  Monnaie d'affichage
                </div>
              </div>
            </div>
            <select
              value={settings.display.currency}
              onChange={(e) =>
                updateSetting("display", "currency", e.target.value)
              }
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-main-black dark:text-main-white"
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Gamification Settings */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-critical" />
          Gamification
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-warning" />
              <div>
                <div className="font-medium text-main-black dark:text-main-white">
                  Système de gamification
                </div>
                <div className="text-sm text-main-black/70 dark:text-main-white/70">
                  Activer les points et niveaux
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleSetting("gamification", "enabled")}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.gamification.enabled
                  ? "bg-main-green"
                  : "bg-medium-grey"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.gamification.enabled
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-info" />
              <div>
                <div className="font-medium text-main-black dark:text-main-white">
                  Classement
                </div>
                <div className="text-sm text-main-black/70 dark:text-main-white/70">
                  Afficher le classement des utilisateurs
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleSetting("gamification", "show_leaderboard")}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.gamification.show_leaderboard
                  ? "bg-main-green"
                  : "bg-medium-grey"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.gamification.show_leaderboard
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
