import React, { useState, useEffect } from "react";
import { Clock, User, DoorOpen, DoorClosed, AlertTriangle } from "lucide-react";
import apiService from "../services/api";
import type { AppError } from "../types";
import { Card } from "./ui";

interface DoorStateHistoryProps {
  sensorId: string;
  className?: string;
}

interface ConfirmationRecord {
  id: string;
  confirmed_state: string;
  previous_state: string;
  previous_certainty: string;
  confidence_before: number | null;
  user_notes: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
  };
}

const DoorStateHistory: React.FC<DoorStateHistoryProps> = ({
  sensorId,
  className = "",
}) => {
  const [history, setHistory] = useState<ConfirmationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [sensorId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      // getDoorStateConfirmationHistory method was removed as it's not supported by our backend
      setHistory([]);
    } catch (err: unknown) {
      const error = err as AppError;
      setError(error.message || "Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "closed":
        return <DoorClosed className="w-4 h-4 text-success" />;
      case "opened":
        return <DoorOpen className="w-4 h-4 text-critical" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-warning" />;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "closed":
        return "text-success";
      case "opened":
        return "text-critical";
      default:
        return "text-warning";
    }
  };

  if (loading) {
    return (
      <Card variant="glass" padding="md" className={className}>
        <div className="text-center py-4">
          <div className="text-white/70">Chargement de l'historique...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="glass" padding="md" className={className}>
        <div className="text-center py-4">
          <div className="text-critical">{error}</div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="md" className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-info" />
        <h3 className="text-lg font-semibold text-white">
          Historique des confirmations
        </h3>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-white/70">
          Aucun historique de confirmation disponible
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((record) => (
            <div
              key={record.id}
              className="bg-white/5 p-3 rounded-lg border border-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStateIcon(record.confirmed_state)}
                  <div>
                    <div className="font-medium text-white">
                      Porte{" "}
                      {record.confirmed_state === "closed"
                        ? "fermée"
                        : "ouverte"}
                    </div>
                    <div className="text-sm text-white/70 mt-1">
                      Précédent: {record.previous_state} (
                      {record.previous_certainty})
                    </div>
                    {record.user_notes && (
                      <div className="text-sm text-white/60 mt-1">
                        Note: {record.user_notes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/70">
                    {new Date(record.created_at).toLocaleString("fr-FR")}
                  </div>
                  <div className="text-xs text-white/50">
                    {record.user.name}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default DoorStateHistory;
