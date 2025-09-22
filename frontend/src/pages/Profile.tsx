import { useState, useEffect } from "react";
import {
  User,
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { GamificationLevel } from "../types";
import apiService from "../services/api";
import { Card } from "../components/ui";

interface ProfileProps {
  userPoints: number;
  userLevel: number;
  gamificationLevel: GamificationLevel | null;
}

const Profile = ({
  userPoints,
  userLevel,
  gamificationLevel,
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

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // TODO: Implémenter l'API getUserProfile dans le backend
      // Pour l'instant, utiliser les données des props si disponibles
      setUserInfo({
        name: "", // Sera rempli par l'API backend
        email: "", // Sera rempli par l'API backend
        organization: "", // Sera rempli par l'API backend
        joinDate: "", // Sera rempli par l'API backend
      });

      // Pas de données d'activité - attendre l'implémentation backend
      setActivityData([]);
    } catch (err: any) {
      console.error("Erreur lors du chargement du profil:", err);
      // En cas d'erreur, garder les valeurs vides
      setActivityData([]);
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (level: number) => {
    if (level >= 50)
      return { name: "Expert", icon: "🏆", color: "text-yellow-400" };
    if (level >= 30)
      return { name: "Avancé", icon: "🥇", color: "text-blue-400" };
    if (level >= 15)
      return { name: "Intermédiaire", icon: "🥈", color: "text-green-400" };
    return { name: "Débutant", icon: "🥉", color: "text-gray-400" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Chargement du profil...
          </h2>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(userLevel);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 text-white">
      {/* Header */}
      <Card variant="glass" padding="lg">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-main-green rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">
                {userInfo.name}
              </h1>
              <div className="space-y-1 text-white/70">
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
            <div className="text-sm text-white/70">Points totaux</div>
          </div>
        </div>
      </Card>

      {/* Level Progress */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
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
            <div className="flex justify-between text-sm text-white/70 mb-2">
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
            <div className="text-xs text-white/50 mt-1">
              {gamificationLevel?.progress_percent?.toFixed(1) || 0}% complété
            </div>
          </div>
        </div>

        <div className="text-white/70">
          Progression vers le niveau{" "}
          {gamificationLevel?.next_level || userLevel + 1}
        </div>
      </Card>

      {/* Activity Chart */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Activité des 7 derniers jours
        </h2>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData}>
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
                dataKey="points"
                stroke="#2FCE65"
                strokeWidth={2}
                name="Points gagnés"
              />
              <Line
                type="monotone"
                dataKey="energy_saved"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Énergie économisée (W)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass" padding="md" className="text-center">
          <div className="text-3xl font-bold text-main-green mb-2">
            {userPoints}
          </div>
          <div className="text-white/70">Points totaux</div>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {userLevel}
          </div>
          <div className="text-white/70">Niveau actuel</div>
        </Card>
        <Card variant="glass" padding="md" className="text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {gamificationLevel?.points_to_next || 100}
          </div>
          <div className="text-white/70">Points vers le prochain niveau</div>
        </Card>
      </div>

      {/* Achievements */}
      <Card variant="glass" padding="lg">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          Réalisations récentes
        </h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="w-10 h-10 bg-yellow-400/20 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="font-medium text-white">
                Premier pas éco-responsable
              </div>
              <div className="text-sm text-white/70">
                Première économie d'énergie détectée
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="w-10 h-10 bg-green-400/20 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="font-medium text-white">
                Économiseur d'énergie
              </div>
              <div className="text-sm text-white/70">
                100W d'énergie économisée
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
