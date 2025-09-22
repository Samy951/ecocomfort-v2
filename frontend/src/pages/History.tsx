import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import apiService from "../services/api";
import { Card } from "../components/ui";

const History = () => {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, [timeRange]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEvents({
        limit: 100,
        start_date: getStartDate(),
        end_date: new Date().toISOString(),
      });
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const now = new Date();
    switch (timeRange) {
      case "24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-critical" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "info":
        return <CheckCircle className="w-4 h-4 text-info" />;
      default:
        return <CheckCircle className="w-4 h-4 text-medium-grey" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-critical";
      case "warning":
        return "text-warning";
      case "info":
        return "text-info";
      default:
        return "text-medium-grey";
    }
  };

  // Générer des données de graphique basées sur les événements
  const generateChartData = () => {
    const days = timeRange === "24h" ? 1 : timeRange === "7d" ? 7 : 30;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.created_at);
        return eventDate.toDateString() === date.toDateString();
      });

      data.push({
        date: date.toLocaleDateString("fr-FR", {
          month: "short",
          day: "numeric",
        }),
        events: dayEvents.length,
        critical: dayEvents.filter((e) => e.severity === "critical").length,
        warning: dayEvents.filter((e) => e.severity === "warning").length,
        info: dayEvents.filter((e) => e.severity === "info").length,
      });
    }

    return data;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-info border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-2">
            Chargement de l'historique...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center p-6 bg-critical/10 rounded-lg border border-critical/30">
          <AlertTriangle className="w-16 h-16 text-critical mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-2">
            Erreur de chargement
          </h2>
          <p className="text-critical/80 mb-4">{error}</p>
          <button
            onClick={loadEvents}
            className="px-4 py-2 bg-info text-main-white rounded-lg hover:bg-info/80 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const chartData = generateChartData();

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 text-main-black dark:text-main-white">
      {/* Header */}
      <Card variant="glass" padding="lg">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-main-black dark:text-main-white mb-2 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-info" />
              Historique des événements
            </h1>
            <p className="text-main-black/70 dark:text-main-white/70">
              Suivi des alertes et événements système
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-main-black dark:text-main-white"
            >
              <option value="24h">24 heures</option>
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2 bg-main-green text-main-black dark:text-main-white rounded-lg hover:bg-main-green/90 transition-colors">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="glass" padding="md" className="text-center">
          <div className="text-3xl font-bold text-main-black dark:text-main-white mb-2">
            {events.length}
          </div>
          <div className="text-main-black/70 dark:text-main-white/70">
            Total événements
          </div>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <div className="text-3xl font-bold text-critical mb-2">
            {events.filter((e) => e.severity === "critical").length}
          </div>
          <div className="text-main-black/70 dark:text-main-white/70">
            Critiques
          </div>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <div className="text-3xl font-bold text-warning mb-2">
            {events.filter((e) => e.severity === "warning").length}
          </div>
          <div className="text-main-black/70 dark:text-main-white/70">
            Avertissements
          </div>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <div className="text-3xl font-bold text-info mb-2">
            {events.filter((e) => e.severity === "info").length}
          </div>
          <div className="text-main-black/70 dark:text-main-white/70">
            Informations
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-info" />
          Événements par jour
        </h2>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  color: "white",
                }}
              />
              <Line
                type="monotone"
                dataKey="events"
                stroke="rgb(47, 206, 101)" // main-green
                strokeWidth={2}
                name="Total événements"
              />
              <Line
                type="monotone"
                dataKey="critical"
                stroke="rgb(239, 68, 68)" // red-500 equivalent
                strokeWidth={2}
                name="Critiques"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Events List */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-success" />
          Liste des événements
        </h2>

        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8 text-main-black/70 dark:text-main-white/70">
              Aucun événement trouvé pour cette période
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="bg-white/5 p-4 rounded-lg border border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(event.severity)}
                    <div>
                      <div className="font-medium text-main-black dark:text-main-white">
                        {event.message}
                      </div>
                      <div className="text-sm text-main-black/70 dark:text-main-white/70 mt-1">
                        {event.sensor?.name} - {event.room?.name}
                      </div>
                      {event.cost_impact && (
                        <div className="text-sm text-warning mt-1">
                          Impact coût: {event.cost_impact.toFixed(2)}€
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-main-black/70 dark:text-main-white/70">
                      {new Date(event.created_at).toLocaleString("fr-FR")}
                    </div>
                    <div
                      className={`text-xs ${getSeverityColor(event.severity)}`}
                    >
                      {event.severity.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default History;
