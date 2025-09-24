import { useState, useEffect } from "react";
import {
  User as UserIcon,
  Mail,
  Building,
  Calendar,
  Trophy,
  Award,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { GamificationLevel } from "../types";
import apiService from "../services/api";
import { Card } from "../components/ui";
import type { User, AppError } from "../types";

interface ProfileProps {
  userPoints: number;
  userLevel: number;
  gamificationLevel: GamificationLevel | null;
  currentUser?: {
    id: string;
    name: string;
    email?: string;
  } | null;
}

const getBadgeInfo = (badgeType: string) => {
  const badges = {
    ENERGY_SAVER: {
      name: "Économiseur d'énergie",
      description: "Coût mensuel inférieur à 10€",
      icon: "🌱",
      bgColor: "bg-emerald-500/20",
    },
    NIGHT_WATCH: {
      name: "Gardien de nuit",
      description: "Aucune ouverture nocturne",
      icon: "🌙",
      bgColor: "bg-indigo-500/20",
    },
    PERFECT_DAY: {
      name: "Journée parfaite",
      description: "Zéro perte d'énergie sur une journée",
      icon: "⭐",
      bgColor: "bg-yellow-500/20",
    },
    QUICK_CLOSE: {
      name: "Fermeture rapide",
      description: "10+ fermetures en moins de 10 secondes",
      icon: "⚡",
      bgColor: "bg-orange-500/20",
    },
    FIRST_WEEK: {
      name: "Première semaine",
      description: "Membre depuis plus d'une semaine",
      icon: "🎉",
      bgColor: "bg-purple-500/20",
    },
    WINTER_GUARDIAN: {
      name: "Gardien de l'hiver",
      description: "Optimal par temps froid (<5°C)",
      icon: "❄️",
      bgColor: "bg-blue-500/20",
    },
  };

  return (
    badges[badgeType as keyof typeof badges] || {
      name: badgeType,
      description: "Badge spécial",
      icon: "🏆",
      bgColor: "bg-gray-500/20",
    }
  );
};

const Profile = ({
  userPoints,
  userLevel,
  gamificationLevel,
  currentUser,
}: ProfileProps) => {
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    organization: "",
    joinDate: "",
  });
  const [activityData, setActivityData] = useState<
    Array<{
      date: string;
      points: number;
      energy_saved: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  // States pour les nouveaux charts
  const [energyData, setEnergyData] = useState<
    Array<{ name: string; energyLoss: number; cost: number }>
  >([]);
  const [doorStats, setDoorStats] = useState<
    Array<{ day: string; opens: number; closes: number; avgDuration: number }>
  >([]);
  const [savings, setSavings] = useState<{
    thisMonth: number;
    lastMonth: number;
    total: number;
    quickCloseCount: number;
    estimatedYearly: number;
  } | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);

  // Theme-aware styling for charts
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(() => update());
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const axisStroke = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)";
  const gridStroke = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const tooltipBg = isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.95)";
  const tooltipBorder = isDark
    ? "1px solid rgba(255,255,255,0.2)"
    : "1px solid rgba(0,0,0,0.1)";
  const tooltipText = isDark ? "white" : "black";

  useEffect(() => {
    loadUserData();
    loadChartsData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Utiliser les données currentUser disponibles
      setUserInfo({
        name: currentUser?.name || "Utilisateur",
        email: currentUser?.email || "",
        organization: "EcoComfort", // TODO: Ajouter au backend si nécessaire
        joinDate: "2024", // TODO: Ajouter la date de création au backend
      });

      // Charger les données d'activité
      const activityResponse = await apiService.getWeeklyActivity();
      setActivityData(activityResponse || []);
    } catch (err: unknown) {
      const error = err as AppError;
      console.error("Erreur lors du chargement du profil:", error);
      // En cas d'erreur, garder les valeurs vides
      setActivityData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChartsData = async () => {
    try {
      setChartsLoading(true);
      const [energy, door, savingsData] = await Promise.all([
        apiService.getChartData(),
        apiService.getDoorUsageStats(),
        apiService.getSavingsStats(),
      ]);
      setEnergyData(energy || []);
      setDoorStats(door || []);
      setSavings(savingsData);
    } catch (error) {
      console.error("Error loading charts:", error);
    } finally {
      setChartsLoading(false);
    }
  };

  const getLevelInfo = (level: number) => {
    switch (level) {
      case 9:
        return { name: "Challenger", icon: "🌟", color: "text-purple" };
      case 8:
        return { name: "Master", icon: "👑", color: "text-yellow" };
      case 7:
        return { name: "Diamond", icon: "💎", color: "text-cyan" };
      case 6:
        return { name: "Emerald", icon: "💚", color: "text-emerald" };
      case 5:
        return { name: "Platinum", icon: "🤍", color: "text-platinum" };
      case 4:
        return { name: "Gold", icon: "🥇", color: "text-warning" };
      case 3:
        return { name: "Silver", icon: "🥈", color: "text-gray" };
      case 2:
        return { name: "Bronze", icon: "🥉", color: "text-orange" };
      default:
        return { name: "Iron", icon: "🔨", color: "text-gray-dark" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-info border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-2">
            Chargement du profil...
          </h2>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(userLevel);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 text-main-black dark:text-main-white">
      {/* Header */}
      <Card variant="glass" padding="lg">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-main-green rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-main-black dark:text-main-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-main-black dark:text-main-white mb-2">
                {userInfo.name}
              </h1>
              <div className="space-y-1 text-main-black/70 dark:text-main-white/70">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{userInfo.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>{userInfo.organization}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Membre depuis {userInfo.joinDate}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-main-green">
              {userPoints}
            </div>
            <div className="text-sm text-main-black/70 dark:text-main-white/70">
              Points totaux
            </div>
          </div>
        </div>
      </Card>

      {/* Level Progress */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Progression du niveau
        </h2>

        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-4xl mb-2">{levelInfo.icon}</div>
            <div className={`font-semibold ${levelInfo.color}`}>
              Niveau {userLevel} - {levelInfo.name}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm text-main-black/70 dark:text-main-white/70 mb-2">
              <span>Progression</span>
              <span>
                {gamificationLevel?.points_for_current || 0} /{" "}
                {gamificationLevel?.points_for_next || 100} points
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-main-green to-emerald-70 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${gamificationLevel?.progress_percent || 0}%`,
                }}
              />
            </div>
            <div className="text-xs text-main-black/50 dark:text-main-white/50 mt-1">
              {gamificationLevel?.progress_percent?.toFixed(1) || 0}% complété
            </div>
          </div>
        </div>

        <div className="text-main-black/70 dark:text-main-white/70">
          Progression vers le niveau{" "}
          {gamificationLevel?.next_level || userLevel + 1}
        </div>
      </Card>

      {/* Activity Chart */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-info" />
          Activité des 7 derniers jours
        </h2>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" stroke={axisStroke} />
              <YAxis stroke={axisStroke} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: tooltipBorder,
                  borderRadius: "8px",
                  color: tooltipText,
                }}
              />
              <Line
                type="monotone"
                dataKey="points"
                stroke="rgb(47, 206, 101)" // main-green
                strokeWidth={2}
                name="Points gagnés"
              />
              <Line
                type="monotone"
                dataKey="energy_saved"
                stroke="rgb(59, 130, 246)" // blue-500 equivalent
                strokeWidth={2}
                name="Énergie économisée (W)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Analyses détaillées */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center text-main-black dark:text-main-white">
          📊 Analyses détaillées
        </h2>

        {chartsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-main-green rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Ligne 1: 2 charts côte à côte */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Chart Consommation Énergétique */}
              <Card variant="glass" padding="md">
                <h3 className="text-lg font-medium mb-3 text-main-black dark:text-main-white">
                  Consommation 24h
                </h3>
                {energyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={energyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={gridStroke}
                      />
                      <XAxis dataKey="name" stroke={axisStroke} />
                      <YAxis stroke={axisStroke} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: tooltipBg,
                          border: tooltipBorder,
                          borderRadius: "8px",
                          color: tooltipText,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="energyLoss"
                        stroke="rgb(47, 206, 101)"
                        strokeWidth={2}
                        dot={false}
                        name="Perte (W)"
                      />
                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth={2}
                        dot={false}
                        name="Coût (€)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-main-black/50 dark:text-main-white/50 text-center py-8">
                    Aucune donnée
                  </p>
                )}
              </Card>

              {/* Chart Utilisation Porte */}
              <Card variant="glass" padding="md">
                <h3 className="text-lg font-medium mb-3 text-main-black dark:text-main-white">
                  Utilisation porte (7j)
                </h3>
                {doorStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={doorStats}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={gridStroke}
                      />
                      <XAxis
                        dataKey="day"
                        stroke={axisStroke}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("fr", {
                            day: "numeric",
                            month: "short",
                          })
                        }
                      />
                      <YAxis stroke={axisStroke} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: tooltipBg,
                          border: tooltipBorder,
                          borderRadius: "8px",
                          color: tooltipText,
                        }}
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString("fr")
                        }
                      />
                      <Bar
                        dataKey="opens"
                        fill="#8B5CF6"
                        radius={[4, 4, 0, 0]}
                        name="Ouvertures"
                      />
                      <Bar
                        dataKey="closes"
                        fill="#EC4899"
                        radius={[4, 4, 0, 0]}
                        name="Fermetures"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-main-black/50 dark:text-main-white/50 text-center py-8">
                    Aucune donnée
                  </p>
                )}
              </Card>
            </div>

            {/* Ligne 2: Card Économies */}
            {savings && (
              <Card variant="glass" padding="lg">
                <h3 className="text-lg font-medium mb-4 text-main-black dark:text-main-white">
                  💰 Économies réalisées
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-main-green">
                      {savings.thisMonth.toFixed(2)}€
                    </p>
                    <p className="text-sm text-main-black/70 dark:text-main-white/70 mt-1">
                      Ce mois
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-main-black dark:text-main-white">
                      {savings.lastMonth.toFixed(2)}€
                    </p>
                    <p className="text-sm text-main-black/70 dark:text-main-white/70 mt-1">
                      Mois dernier
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-info">
                      {savings.quickCloseCount}
                    </p>
                    <p className="text-sm text-main-black/70 dark:text-main-white/70 mt-1">
                      Fermetures rapides
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-secondary">
                      {savings.total.toFixed(2)}€
                    </p>
                    <p className="text-sm text-main-black/70 dark:text-main-white/70 mt-1">
                      Total économisé
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-warning">
                      {savings.estimatedYearly.toFixed(2)}€
                    </p>
                    <p className="text-sm text-main-black/70 dark:text-main-white/70 mt-1">
                      Projection annuelle
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass" padding="md" className="text-center">
          <div className="text-3xl font-bold text-main-green mb-2">
            {userPoints}
          </div>
          <div className="text-main-black/70 dark:text-main-white/70">
            Points totaux
          </div>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <div className="text-3xl font-bold text-info mb-2">{userLevel}</div>
          <div className="text-main-black/70 dark:text-main-white/70">
            Niveau actuel
          </div>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <div className="text-3xl font-bold text-warning mb-2">
            {gamificationLevel?.points_to_next || 100}
          </div>
          <div className="text-main-black/70 dark:text-main-white/70">
            Points vers le prochain niveau
          </div>
        </Card>
      </div>

      {/* Achievements */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-main-black dark:text-main-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-warning" />
          Badges obtenus
        </h2>

        <div className="space-y-3">
          {gamificationLevel?.achievements?.badges &&
          Array.isArray(gamificationLevel.achievements.badges) &&
          gamificationLevel.achievements.badges.length > 0 ? (
            gamificationLevel.achievements.badges.map(
              (badgeType: string, index: number) => {
                const badgeInfo = getBadgeInfo(badgeType);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                  >
                    <div
                      className={`w-10 h-10 ${badgeInfo.bgColor} rounded-full flex items-center justify-center`}
                    >
                      <span className="text-lg">{badgeInfo.icon}</span>
                    </div>
                    <div>
                      <div className="font-medium text-main-black dark:text-main-white">
                        {badgeInfo.name}
                      </div>
                      <div className="text-sm text-main-black/70 dark:text-main-white/70">
                        {badgeInfo.description}
                      </div>
                    </div>
                  </div>
                );
              }
            )
          ) : (
            <div className="text-center py-6 text-main-black/50 dark:text-main-white/50">
              <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun badge obtenu pour le moment</p>
              <p className="text-xs mt-1">
                Continuez vos efforts pour débloquer des récompenses !
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Profile;
