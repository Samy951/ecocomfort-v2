import React, { useState, useEffect } from "react";
import {
  Building,
  DoorOpen,
  Wifi,
  Settings,
  Users,
  Shield,
} from "lucide-react";
import apiService from "../services/api";
import { Card } from "../components/ui";

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSensors: 0,
    activeSensors: 0,
    totalRooms: 0,
    totalBuildings: 0,
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [sensorsData, overviewData] = await Promise.all([
        apiService.getSensorData().catch((err) => {
          console.warn("Failed to fetch sensor data:", err);
          return { sensors: [] };
        }),
        apiService.getDashboardOverview().catch((err) => {
          console.warn("Failed to fetch dashboard overview:", err);
          return { infrastructure: { total_rooms: 0, total_buildings: 0 } };
        }),
      ]);

      setStats({
        totalSensors: sensorsData.sensors?.length || 0,
        activeSensors:
          sensorsData.sensors?.filter((s: any) => s.is_online).length || 0,
        totalRooms: overviewData.infrastructure?.total_rooms || 0,
        totalBuildings: overviewData.infrastructure?.total_buildings || 0,
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des données admin");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-info border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-2">
            Chargement de l'administration...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center p-6 bg-critical/10 rounded-lg border border-critical/30">
          <Shield className="w-16 h-16 text-critical mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-2">
            Erreur d'accès
          </h2>
          <p className="text-critical/80 mb-4">{error}</p>
          <button
            onClick={loadAdminData}
            className="px-4 py-2 bg-info text-main-white rounded-lg hover:bg-info/80 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 text-main-black dark:text-main-white">
      {/* Header */}
      <Card variant="glass" padding="lg">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-critical" />
          <div>
            <h1 className="text-3xl font-bold text-main-black dark:text-main-white">
              Administration
            </h1>
            <p className="text-main-black/70 dark:text-main-white/70">
              Gestion du système EcoComfort
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" padding="lg" className="text-center">
          <Building className="w-8 h-8 text-info mx-auto mb-3" />
          <div className="text-3xl font-bold text-main-black dark:text-main-white mb-2">
            {stats.totalBuildings}
          </div>
          <div className="text-main-black/70 dark:text-main-white/70">
            Bâtiments
          </div>
        </Card>

        <Card variant="glass" padding="lg" className="text-center">
          <DoorOpen className="w-8 h-8 text-success mx-auto mb-3" />
          <div className="text-3xl font-bold text-main-black dark:text-main-white mb-2">
            {stats.totalRooms}
          </div>
          <div className="text-main-black/70 dark:text-main-white/70">
            Pièces
          </div>
        </Card>

        <Card variant="glass" padding="lg" className="text-center">
          <Wifi className="w-8 h-8 text-warning mx-auto mb-3" />
          <div className="text-3xl font-bold text-main-black dark:text-main-white mb-2">
            {stats.totalSensors}
          </div>
          <div className="text-main-black/70 dark:text-main-white/70">
            Capteurs totaux
          </div>
        </Card>

        <Card variant="glass" padding="lg" className="text-center">
          <Settings className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <div className="text-3xl font-bold text-main-black dark:text-main-white mb-2">
            {stats.activeSensors}
          </div>
          <div className="text-main-black/70 dark:text-main-white/70">
            Capteurs actifs
          </div>
        </Card>
      </div>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Status */}
        <Card variant="glass" padding="lg">
          <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-info" />
            État du système
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-main-black/70 dark:text-main-white/70">
                API Backend
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-success text-sm">Connecté</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-main-black/70 dark:text-main-white/70">
                WebSocket
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-success text-sm">Actif</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-main-black/70 dark:text-main-white/70">
                Base de données
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-success text-sm">Opérationnelle</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-main-black/70 dark:text-main-white/70">
                Capteurs IoT
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span className="text-warning text-sm">
                  {stats.activeSensors}/{stats.totalSensors} actifs
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card variant="glass" padding="lg">
          <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-success" />
            Actions rapides
          </h2>

          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-info" />
              <span className="text-main-black dark:text-main-white">
                Configuration système
              </span>
            </button>

            <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Users className="w-5 h-5 text-success" />
              <span className="text-main-black dark:text-main-white">
                Gestion utilisateurs
              </span>
            </button>

            <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Building className="w-5 h-5 text-purple-400" />
              <span className="text-main-black dark:text-main-white">
                Gestion bâtiments
              </span>
            </button>

            <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Wifi className="w-5 h-5 text-warning" />
              <span className="text-main-black dark:text-main-white">
                Configuration capteurs
              </span>
            </button>
          </div>
        </Card>
      </div>

      {/* System Information */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-critical" />
          Informations système
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-main-black dark:text-main-white mb-3">
              Version
            </h3>
            <div className="space-y-2 text-main-black/70 dark:text-main-white/70">
              <div>EcoComfort MVP v1.0.0</div>
              <div>Frontend: React + TypeScript</div>
              <div>Backend: NestJS + PostgreSQL</div>
              <div>IoT: MQTT + WebSocket</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-main-black dark:text-main-white mb-3">
              Endpoints utilisés
            </h3>
            <div className="space-y-2 text-main-black/70 dark:text-main-white/70 text-sm">
              <div>• GET /api/dashboard/sensor-data</div>
              <div>• GET /api/dashboard/energy-analytics</div>
              <div>• GET /api/dashboard/overview</div>
              <div>• GET /api/gamification/stats</div>
              <div>• POST /auth/login</div>
              <div>• GET /auth/user</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Admin;
