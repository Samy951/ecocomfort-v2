import { useState, useEffect, useCallback } from "react";
import {
  Thermometer,
  Droplets,
  DoorOpen,
  Zap,
  AlertTriangle,
  Activity,
  TrendingUp,
  Trophy,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import webSocketService from "../services/websocket";
import Gamification from "../components/Gamification";
import apiService from "../services/api";
import type { GamificationLevel } from "../types";
import { Card, Typography, Button } from "../components/ui";

interface DashboardProps {
  setIsConnected: (connected: boolean) => void;
  gamification: GamificationLevel | null;
  currentUser: { name: string; points: number; level: number };
}

const Dashboard = ({
  setIsConnected,
  gamification,
  currentUser,
}: DashboardProps) => {
  const [currentSensors, setCurrentSensors] = useState<any>(null);
  const [currentEnergy, setCurrentEnergy] = useState<any>(null);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [gamificationStats, setGamificationStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [sensorsData, energyData, dailyData, gamificationData] =
        await Promise.all([
          apiService.getSensorData(),
          apiService.getEnergyAnalytics(1),
          apiService.getDashboardOverview(),
          apiService.getGamificationData(),
        ]);

      setCurrentSensors(sensorsData);
      setCurrentEnergy(energyData);
      setDailyReport(dailyData);
      setGamificationStats(gamificationData);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des données");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadAllData]);

  useEffect(() => {
    const unsubscribeConnected = webSocketService.on("connected", () => {
      setIsConnected(true);
    });

    const unsubscribeDisconnected = webSocketService.on("disconnected", () => {
      setIsConnected(false);
    });

    const unsubscribeDoorState = webSocketService.on(
      "door-state-certainty-changed",
      (event: any) => {
        console.log("🚪 Door state changed:", event);
        loadAllData();
      }
    );

    const unsubscribeSensorData = webSocketService.on(
      "sensor-data-updated",
      (event: any) => {
        console.log("📊 Sensor data updated:", event);
        loadAllData();
      }
    );

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeDoorState();
      unsubscribeSensorData();
    };
  }, [setIsConnected, loadAllData]);

  const generateChartData = useCallback(() => {
    const data = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const hour = (now.getHours() - i + 24) % 24;
      data.unshift({
        name: `${hour}h`,
        temperature: 20 + Math.random() * 2 - 1,
        humidity: 60 + Math.random() * 5 - 2.5,
        energyLoss: 50 + Math.random() * 10 - 5,
      });
    }
    return data;
  }, []);

  const [chartData, setChartData] = useState(generateChartData());

  useEffect(() => {
    setChartData(generateChartData());
  }, [generateChartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="w-10 h-10 animate-spin text-main-green" />
        <Typography variant="h4" className="ml-4">
          Chargement du tableau de bord...
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="default" className="p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-error mx-auto mb-4" />
        <Typography variant="h4" color="error" className="mb-2">
          Erreur de chargement
        </Typography>
        <Typography variant="paragraph-medium" color="dark-grey">
          {error}
        </Typography>
        <Button onClick={loadAllData} className="mt-4">
          Réessayer
        </Button>
      </Card>
    );
  }

  const sensors = currentSensors?.sensors || [];
  const sensorsWithTemp = sensors.filter(
    (s: any) =>
      s.data?.temperature !== null && s.data?.temperature !== undefined
  );
  const averageTemperature =
    sensorsWithTemp.length > 0
      ? sensorsWithTemp.reduce(
          (sum: number, s: any) => sum + (Number(s.data?.temperature) || 0),
          0
        ) / sensorsWithTemp.length
      : 0;

  const sensorsWithOpenDoors = sensors.filter(
    (s: any) => s.data?.door_state === true
  );
  const doorsOpenCount = sensorsWithOpenDoors.length;

  const totalEnergyLoss = sensors.reduce((sum: number, s: any) => {
    const energyLoss = Number(s.data?.energy_loss_watts) || 0;
    return sum + energyLoss;
  }, 0);

  const activeSensors = sensors.filter((s: any) => s.is_online).length;
  const totalSensors = sensors.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="glass" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Typography
              variant="h2"
              className="text-main-black dark:text-main-white"
            >
              Bonjour, {currentUser.name} !
            </Typography>
            <Typography variant="paragraph-medium" color="dark-grey">
              Bienvenue sur votre tableau de bord EcoComfort. Dernière mise à
              jour: {lastUpdate.toLocaleTimeString()}
            </Typography>
          </div>
          <Button
            onClick={loadAllData}
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Actualiser
          </Button>
        </div>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          variant="glass"
          padding="md"
          className="flex items-center justify-between"
        >
          <div>
            <Typography variant="paragraph-small" color="medium-grey">
              Température Moyenne
            </Typography>
            <Typography variant="h4" color="main-white">
              {averageTemperature.toFixed(1)}°C
            </Typography>
          </div>
          <Thermometer className="w-8 h-8 text-main-green" />
        </Card>

        <Card
          variant="glass"
          padding="md"
          className="flex items-center justify-between"
        >
          <div>
            <Typography variant="paragraph-small" color="medium-grey">
              Portes Ouvertes
            </Typography>
            <Typography variant="h4" color="main-white">
              {doorsOpenCount}
            </Typography>
          </div>
          <DoorOpen className="w-8 h-8 text-error" />
        </Card>

        <Card
          variant="glass"
          padding="md"
          className="flex items-center justify-between"
        >
          <div>
            <Typography variant="paragraph-small" color="medium-grey">
              Perte Énergétique
            </Typography>
            <Typography variant="h4" color="main-white">
              {totalEnergyLoss.toFixed(2)} W
            </Typography>
          </div>
          <Zap className="w-8 h-8 text-yellow-400" />
        </Card>

        <Card
          variant="glass"
          padding="md"
          className="flex items-center justify-between"
        >
          <div>
            <Typography variant="paragraph-small" color="medium-grey">
              Capteurs Actifs
            </Typography>
            <Typography variant="h4" color="main-white">
              {activeSensors} / {totalSensors}
            </Typography>
          </div>
          <Activity className="w-8 h-8 text-blue-400" />
        </Card>
      </div>

      {/* Energy Analytics Chart */}
      <Card variant="glass" padding="lg">
        <Typography variant="h4" className="mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Analyse Énergétique (Dernières 24h)
        </Typography>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
              <YAxis yAxisId="left" stroke="rgba(255,255,255,0.7)" />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="rgba(255,255,255,0.7)"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101010",
                  border: "none",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#2FCE65" }}
                itemStyle={{ color: "#FFFFFF" }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="temperature"
                stroke="#2FCE65"
                fill="#2FCE65"
                fillOpacity={0.3}
                name="Température (°C)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="energyLoss"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.2}
                name="Perte Énergétique (W)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Real-time Sensors */}
      <Card variant="glass" padding="lg">
        <Typography variant="h4" className="mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" /> Capteurs Temps Réel
        </Typography>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sensors.length > 0 ? (
            sensors.map((sensor: any) => (
              <Card
                key={sensor.sensor_id}
                variant="glass"
                padding="md"
                className={`${!sensor.has_usable_data ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Typography variant="h5" color="main-white">
                      {sensor.name}
                    </Typography>
                    <Typography variant="paragraph-small" color="medium-grey">
                      {sensor.room.name}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        sensor.is_online ? "bg-main-green" : "bg-error"
                      }`}
                    />
                    <Typography variant="paragraph-small" color="medium-grey">
                      {sensor.is_online ? "En ligne" : "Hors ligne"}
                    </Typography>
                  </div>
                </div>

                {sensor.has_usable_data ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white">
                      <Thermometer className="w-4 h-4 text-main-green" />
                      <Typography variant="paragraph-small">
                        Température:{" "}
                        {sensor.data?.temperature?.toFixed(1) || "N/A"}°C
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      <Typography variant="paragraph-small">
                        Humidité: {sensor.data?.humidity?.toFixed(1) || "N/A"}%
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <Typography variant="paragraph-small">
                        Perte Énergétique:{" "}
                        {sensor.data?.energy_loss_watts?.toFixed(2) || "N/A"} W
                      </Typography>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <Typography variant="paragraph-small" color="medium-grey">
                      Pas de données utilisables pour ce capteur.
                    </Typography>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <Typography variant="h5" color="dark-grey" className="mb-2">
                Aucun capteur trouvé
              </Typography>
              <Typography variant="paragraph-medium" color="medium-grey">
                Veuillez ajouter des capteurs pour commencer le monitoring.
              </Typography>
            </div>
          )}
        </div>
      </Card>

      {/* Gamification Section */}
      {gamification && (
        <Gamification
          userLevel={gamification}
          userPoints={currentUser.points}
          className="mt-6"
        />
      )}

      {/* Footer */}
      <div className="text-center text-white/50 text-sm">
        <Typography variant="paragraph-small">
          Dernière mise à jour: {lastUpdate.toLocaleString("fr-FR")}
        </Typography>
        <Typography variant="paragraph-small">
          EcoComfort MVP - Système de monitoring énergétique IoT
        </Typography>
      </div>
    </div>
  );
};

export default Dashboard;
