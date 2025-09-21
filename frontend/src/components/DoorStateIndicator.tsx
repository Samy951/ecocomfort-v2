import React, { useState } from "react";
import { DoorOpen, DoorClosed, AlertTriangle, CheckCircle } from "lucide-react";
import { Card } from "./ui";

interface DoorStateIndicatorProps {
  state: "closed" | "opened" | "probably_opened" | "moving";
  certainty: "CERTAIN" | "PROBABLE" | "UNCERTAIN";
  needsConfirmation: boolean;
  sensorId: string;
  onConfirmState?: (
    sensorId: string,
    state: "closed" | "opened",
    notes?: string
  ) => void;
  className?: string;
}

const DoorStateIndicator: React.FC<DoorStateIndicatorProps> = ({
  state,
  certainty,
  needsConfirmation,
  sensorId,
  onConfirmState,
  className = "",
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmState, setConfirmState] = useState<"closed" | "opened">(
    "closed"
  );
  const [notes, setNotes] = useState("");

  const stateConfig = {
    closed: {
      label: "FERMÉE",
      icon: DoorClosed,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/30",
    },
    opened: {
      label: "OUVERTE",
      icon: DoorOpen,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500/30",
    },
    probably_opened: {
      label: "PROBABLEMENT OUVERTE",
      icon: AlertTriangle,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/30",
    },
    moving: {
      label: "EN MOUVEMENT",
      icon: DoorOpen,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30",
    },
  };

  const certaintyConfig = {
    CERTAIN: { label: "Certain", color: "text-green-400" },
    PROBABLE: { label: "Probable", color: "text-yellow-400" },
    UNCERTAIN: { label: "Incertain", color: "text-red-400" },
  };

  const config = stateConfig[state];
  const certaintyInfo = certaintyConfig[certainty];
  const Icon = config.icon;

  const handleConfirm = () => {
    if (onConfirmState) {
      onConfirmState(sensorId, confirmState, notes);
    }
    setShowConfirmModal(false);
    setNotes("");
  };

  return (
    <>
      <div
        className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            <div>
              <div className={`font-medium ${config.color}`}>
                {config.label}
              </div>
              <div className={`text-xs ${certaintyInfo.color}`}>
                {certaintyInfo.label}
              </div>
            </div>
          </div>

          {needsConfirmation && (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
            >
              Confirmer
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card variant="glass" padding="lg" className="w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirmer l'état de la porte
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  État de la porte
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmState("closed")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-colors ${
                      confirmState === "closed"
                        ? "bg-green-500/20 border-green-500 text-green-400"
                        : "bg-white/5 border-white/20 text-white/70"
                    }`}
                  >
                    <DoorClosed className="w-4 h-4" />
                    Fermée
                  </button>
                  <button
                    onClick={() => setConfirmState("opened")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-colors ${
                      confirmState === "opened"
                        ? "bg-red-500/20 border-red-500 text-red-400"
                        : "bg-white/5 border-white/20 text-white/70"
                    }`}
                  >
                    <DoorOpen className="w-4 h-4" />
                    Ouverte
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:border-main-green focus:outline-none"
                  placeholder="Ajoutez des détails..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-main-green text-white py-2 px-4 rounded-lg hover:bg-main-green/90 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmer
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default DoorStateIndicator;
