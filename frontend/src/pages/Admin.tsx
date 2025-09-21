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
        apiService.getSensors(),
        apiService.getDashboardOverview(),
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
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Chargement de l'administration...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center p-6 bg-red-900/50 rounded-lg border border-red-700">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Erreur d'accès
          </h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={loadAdminData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 text-white">
      {/* Header */}
      <Card variant="glass" padding="lg">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-red-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Administration</h1>
            <p className="text-white/70">Gestion du système EcoComfort</p>
          </div>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" padding="lg" className="text-center">
          <Building className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <div className="text-3xl font-bold text-white mb-2">
            {stats.totalBuildings}
          </div>
          <div className="text-white/70">Bâtiments</div>
        </Card>

        <Card variant="glass" padding="lg" className="text-center">
          <DoorOpen className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <div className="text-3xl font-bold text-white mb-2">
            {stats.totalRooms}
          </div>
          <div className="text-white/70">Pièces</div>
        </Card>

        <Card variant="glass" padding="lg" className="text-center">
          <Wifi className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <div className="text-3xl font-bold text-white mb-2">
            {stats.totalSensors}
          </div>
          <div className="text-white/70">Capteurs totaux</div>
        </Card>

        <Card variant="glass" padding="lg" className="text-center">
          <Settings className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <div className="text-3xl font-bold text-white mb-2">
            {stats.activeSensors}
          </div>
          <div className="text-white/70">Capteurs actifs</div>
        </Card>
      </div>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Status */}
        <Card variant="glass" padding="lg">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            État du système
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70">API Backend</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm">Connecté</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/70">WebSocket</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm">Actif</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/70">Base de données</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm">Opérationnelle</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/70">Capteurs IoT</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-yellow-400 text-sm">
                  {stats.activeSensors}/{stats.totalSensors} actifs
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card variant="glass" padding="lg">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            Actions rapides
          </h2>

          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-blue-400" />
              <span className="text-white">Configuration système</span>
            </button>

            <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-white">Gestion utilisateurs</span>
            </button>

            <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Building className="w-5 h-5 text-purple-400" />
              <span className="text-white">Gestion bâtiments</span>
            </button>

            <button className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Wifi className="w-5 h-5 text-yellow-400" />
              <span className="text-white">Configuration capteurs</span>
            </button>
          </div>
        </Card>
      </div>

      {/* System Information */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-400" />
          Informations système
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Version</h3>
            <div className="space-y-2 text-white/70">
              <div>EcoComfort MVP v1.0.0</div>
              <div>Frontend: React + TypeScript</div>
              <div>Backend: NestJS + PostgreSQL</div>
              <div>IoT: MQTT + WebSocket</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-3">
              Endpoints utilisés
            </h3>
            <div className="space-y-2 text-white/70 text-sm">
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
