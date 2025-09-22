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
import * as SensorsApi from "../services/api/sensors";
import * as DashboardApi from "../services/api/dashboard";
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
  const [currentSensors, setCurrentSensors] = useState<{
    doorOpen: boolean;
    averageTemperature: number | null;
    averageHumidity: number | null;
    sensors: Array<{
      sensorId: string;
      type: "temperature" | "humidity" | "pressure";
      value: number | null;
      lastUpdate: Date | null;
      isOnline: boolean;
    }>;
    timestamp: Date;
  } | null>(null);
  const [currentEnergy, setCurrentEnergy] = useState<any>(null);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Theme awareness for charts – must be before any conditional return
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    if (typeof document === "undefined") return true;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const handler = () => {
      const dark = document.documentElement.classList.contains("dark");
      setIsDarkTheme(dark);
    };
    window.addEventListener("theme:changed", handler as EventListener);
    handler();
    return () =>
      window.removeEventListener("theme:changed", handler as EventListener);
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Charger les données séparément pour éviter les conflits de types
      try {
        const sensorsData = await SensorsApi.getSensorData().catch((err) => {
          console.warn("Failed to fetch sensor data:", err);
          return null;
        });
        if (sensorsData) setCurrentSensors(sensorsData);

        const energyData = await DashboardApi.getEnergyAnalytics().catch(
          (err) => {
            console.warn("Failed to fetch energy data:", err);
            // Retourner des données par défaut en cas d'erreur backend
            return {
              currentLossWatts: 0,
              currentCostPerHour: 0,
              doorOpenDuration: 0,
              indoorTemp: 20,
              outdoorTemp: 15,
              timestamp: new Date(),
            };
          }
        );
        if (energyData) setCurrentEnergy(energyData);

        const dailyData = await DashboardApi.getEnergyDaily().catch((err) => {
          console.warn("Failed to fetch dashboard overview:", err);
          return null;
        });
        if (dailyData) {
          setDailyReport(dailyData);
          const hourly = dailyData.hourlyMetrics;
          if (hourly && hourly.length) {
            const data = hourly.map((h) => ({
              name: `${h.hour}h`,
              energyLoss: h.totalLossWatts ?? 0,
            }));
            setChartData(data as any);
          }
        }

        // Note: gamificationData sera géré par le composant parent (App.tsx)
      } catch (err: any) {
        console.warn("Error loading individual data:", err);
      }

      setLastUpdate(new Date());
    } catch (err: any) {
      setError("Erreur lors du chargement des données");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    // Only start auto-refresh if we have some data loaded
    if (
      (currentSensors?.sensors?.length || 0) > 0 ||
      currentEnergy ||
      dailyReport
    ) {
      const interval = setInterval(() => {
        loadAllData();
      }, 60000); // 1 minute interval

      return () => clearInterval(interval);
    }
  }, [
    loadAllData,
    currentSensors?.sensors?.length || 0,
    currentEnergy,
    dailyReport,
  ]);

  useEffect(() => {
    const unsubscribeConnected = webSocketService.on("connected", () => {
      setIsConnected(true);
    });

    const unsubscribeDisconnected = webSocketService.on("disconnected", () => {
      setIsConnected(false);
    });

    const unsubscribeDoorState = webSocketService.on(
      "door-state-changed",
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

    const unsubscribePointsAwarded = webSocketService.on(
      "points-awarded",
      (event: any) => {
        console.log("🏆 Points awarded:", event);
        // TODO: Mettre à jour les points utilisateur
      }
    );

    const unsubscribeLevelUp = webSocketService.on("level-up", (event: any) => {
      console.log("⬆️ Level up:", event);
      // TODO: Mettre à jour le niveau utilisateur
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeDoorState();
      unsubscribeSensorData();
      unsubscribePointsAwarded();
      unsubscribeLevelUp();
    };
  }, [setIsConnected, loadAllData]);

  // Pas de données factices - utiliser les vraies données du backend
  const [chartData, setChartData] = useState([]);

  // Fallback chart data to avoid empty white chart
  useEffect(() => {
    if (!chartData || (Array.isArray(chartData) && chartData.length === 0)) {
      const data = Array.from({ length: 12 }, (_, i) => ({
        name: `${i * 2}h`,
        energyLoss: 0,
      }));
      setChartData(data as any);
    }
  }, [chartData]);

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
  const temperatureSensors = sensors.filter(
    (s) => s.type === "temperature" && s.value !== null
  );
  const averageTemperature = currentSensors?.averageTemperature || 0;
  const doorsOpenCount = currentSensors?.doorOpen ? 1 : 0;

  const totalEnergyLoss = currentEnergy?.currentLossWatts || 0;

  const activeSensors = sensors.filter((s) => s.isOnline).length;
  const totalSensors = sensors.length;

  const axisColor = isDarkTheme ? "rgba(255,255,255,0.85)" : "#111827"; // tick text color
  const axisLineColor = isDarkTheme
    ? "rgba(255,255,255,0.7)"
    : "rgba(17,24,39,0.4)"; // line color
  const gridColor = isDarkTheme
    ? "rgba(255,255,255,0.1)"
    : "rgba(17,24,39,0.1)";

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
          <Zap className="w-8 h-8 text-warning" />
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
          <Activity className="w-8 h-8 text-info" />
        </Card>
      </div>

      {/* Energy Analytics Chart */}
      <Card variant="glass" padding="lg">
        <Typography variant="h4" className="mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Analyse Énergétique (Dernières 24h)
        </Typography>
        <div className="h-80">
          {Array.isArray(chartData) &&
          chartData.every((d: any) => (d?.energyLoss ?? 0) === 0) ? (
            <div className="h-full flex items-center justify-center text-medium-grey">
              Aucune donnée disponible pour les dernières 24h
            </div>
          ) : (
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
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  stroke={axisLineColor}
                  tick={{ fill: axisColor, fontSize: 12 }}
                  tickMargin={8}
                  tickLine={{ stroke: axisLineColor }}
                  axisLine={{ stroke: axisLineColor }}
                  interval="preserveStartEnd"
                  minTickGap={12}
                  height={30}
                />
                <YAxis
                  yAxisId="left"
                  stroke={axisLineColor}
                  tick={{ fill: axisColor, fontSize: 12 }}
                  tickMargin={8}
                  tickLine={{ stroke: axisLineColor }}
                  axisLine={{ stroke: axisLineColor }}
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => (dataMax || 0) * 1.2 + 1]}
                  width={44}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={axisLineColor}
                  tick={{ fill: axisColor, fontSize: 12 }}
                  tickMargin={8}
                  tickLine={{ stroke: axisLineColor }}
                  axisLine={{ stroke: axisLineColor }}
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => (dataMax || 0) * 1.2 + 1]}
                  width={44}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkTheme
                      ? "rgb(16, 16, 16)"
                      : "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    color: isDarkTheme ? "#fff" : "#111827",
                  }}
                  labelStyle={{ color: "rgb(47, 206, 101)" }}
                  itemStyle={{ color: isDarkTheme ? "#fff" : "#111827" }}
                />
                {/* If we later add temperature series, enable this area */}
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="energyLoss"
                  stroke={isDarkTheme ? "rgb(245, 158, 11)" : "#2563eb"}
                  fill={isDarkTheme ? "rgb(245, 158, 11)" : "#2563eb"}
                  fillOpacity={0.2}
                  name="Perte Énergétique (W)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Real-time Sensors */}
      <Card variant="glass" padding="lg">
        <Typography variant="h4" className="mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" /> Capteurs Temps Réel
        </Typography>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sensors.length > 0 ? (
            sensors.map((sensor: any, index: number) => (
              <Card
                key={sensor.sensor_id || `sensor-${index}`}
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
                      {sensor.room?.name || "Salle inconnue"}
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
                    <div className="flex items-center gap-2 text-main-black dark:text-main-white">
                      <Thermometer className="w-4 h-4 text-main-green" />
                      <Typography variant="paragraph-small">
                        Température:{" "}
                        {sensor.data?.temperature?.toFixed(1) || "N/A"}°C
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2 text-main-black dark:text-main-white">
                      <Droplets className="w-4 h-4 text-info" />
                      <Typography variant="paragraph-small">
                        Humidité: {sensor.data?.humidity?.toFixed(1) || "N/A"}%
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2 text-main-black dark:text-main-white">
                      <Zap className="w-4 h-4 text-warning" />
                      <Typography variant="paragraph-small">
                        Perte Énergétique:{" "}
                        {sensor.data?.energy_loss_watts?.toFixed(2) || "N/A"} W
                      </Typography>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
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
      <div className="text-center text-main-black/50 dark:text-main-white/50 text-sm">
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
