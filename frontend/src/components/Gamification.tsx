import React from "react";
import { Trophy, Award, Star, TrendingUp, Zap, Leaf } from "lucide-react";
import type { GamificationLevel } from "../types";
import { Card } from "./ui";

interface GamificationProps {
  userLevel: GamificationLevel | null;
  userPoints: number;
  className?: string;
}

const Gamification: React.FC<GamificationProps> = ({
  userLevel,
  userPoints,
  className = "",
}) => {
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

  const levelInfo = getLevelInfo(userLevel?.current_level || 1);
  const progressPercent = userLevel?.progress_percent || 0;

  return (
    <Card variant="glass" padding="lg" className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-main-black dark:text-main-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Gamification
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-main-black dark:text-main-white">
            {userPoints}
          </div>
          <div className="text-sm text-main-black/70 dark:text-main-white/70">
            Points
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{levelInfo.icon}</span>
            <div>
              <div className={`font-semibold ${levelInfo.color}`}>
                Niveau {userLevel?.current_level || 1} - {levelInfo.name}
              </div>
              <div className="text-sm text-main-black/70 dark:text-main-white/70">
                Progression vers le niveau {userLevel?.next_level || 2}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-main-black/70 dark:text-main-white/70">
              {userLevel?.points_for_current || 0} /{" "}
              {userLevel?.points_for_next || 100}
            </div>
            <div className="text-xs text-main-black/50 dark:text-main-white/50">
              points
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-main-black/10 dark:bg-main-white/10 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-main-green to-emerald-70 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-main-black/50 dark:text-main-white/50 mt-1">
          {progressPercent.toFixed(1)}% complété
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-lg font-bold text-main-green">
            {userLevel?.current_level || 1}
          </div>
          <div className="text-xs text-main-black/70 dark:text-main-white/70">
            Niveau actuel
          </div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-lg font-bold text-info">
            {userLevel?.points_to_next || 100}
          </div>
          <div className="text-xs text-main-black/70 dark:text-main-white/70">
            Points restants
          </div>
        </div>
      </div>

      {/* Achievements Preview */}
      <div className="mt-6 pt-4 border-t border-grey/50 dark:border-dark-grey/50">
        <h4 className="text-sm font-medium text-main-black dark:text-main-white mb-3 flex items-center gap-2">
          <Award className="w-4 h-4" />
          Réalisations récentes
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-main-black/70 dark:text-main-white/70">
            <Star className="w-4 h-4 text-warning" />
            <span>Premier pas éco-responsable</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-main-black/70 dark:text-main-white/70">
            <Zap className="w-4 h-4 text-info" />
            <span>Économie d'énergie détectée</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-main-black/70 dark:text-main-white/70">
            <Leaf className="w-4 h-4 text-success" />
            <span>Contribution environnementale</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Gamification;
