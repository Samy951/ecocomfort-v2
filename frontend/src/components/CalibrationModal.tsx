import React, { useState } from "react";
import { X, Settings, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import * as SensorsApi from "../services/api/sensors";
import { Card } from "./ui";

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensor: {
    sensor_id: string;
    name: string;
    room: {
      name: string;
      building_name: string;
    };
  };
}

const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  sensor,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "checking" | "calibrating" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleCalibration = async () => {
    setIsLoading(true);
    setStatus("checking");
    setMessage("Vérification de la stabilité du capteur...");

    try {
      // Vérifier la stabilité du capteur
      const stability: any = await SensorsApi.checkSensorStability(
        sensor.sensor_id
      );

      if (!stability.stable) {
        setStatus("error");
        setMessage(
          stability.reason || "Le capteur n'est pas stable pour la calibration"
        );
        return;
      }

      setStatus("calibrating");
      setMessage("Calibration en cours...");

      // Effectuer la calibration
      const result: any = await SensorsApi.calibrateDoorPosition(
        sensor.sensor_id,
        {
          type: "closed_position",
          confirm: true,
        }
      );

      if (result.success) {
        setStatus("success");
        setMessage("Calibration réussie !");
      } else {
        setStatus("error");
        setMessage(result.message || "Erreur lors de la calibration");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Erreur lors de la calibration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calibration-title"
    >
      <Card variant="glass" padding="lg" className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 id="calibration-title" className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Calibration du capteur
          </h3>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Fermer la fenêtre de calibration"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-white/70 mb-1">Capteur</div>
          <div className="text-white font-medium">{sensor.name}</div>
          <div className="text-sm text-white/60">
            {sensor.room.building_name} - {sensor.room.name}
          </div>
        </div>

        {status === "idle" && (
          <div className="space-y-4">
            <div className="text-sm text-white/70">
              Cette action va calibrer la position fermée de la porte pour ce
              capteur. Assurez-vous que la porte est fermée avant de continuer.
            </div>
            <button
              onClick={handleCalibration}
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full bg-main-green text-white py-2 px-4 rounded-lg hover:bg-main-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Commencer la calibration
            </button>
          </div>
        )}

        {status === "checking" && (
          <div className="text-center py-4">
            <Loader2 className="w-8 h-8 text-info animate-spin mx-auto mb-2" />
            <div className="text-white/70">{message}</div>
          </div>
        )}

        {status === "calibrating" && (
          <div className="text-center py-4">
            <Loader2 className="w-8 h-8 text-warning animate-spin mx-auto mb-2" />
            <div className="text-white/70">{message}</div>
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
            <div className="text-white font-medium mb-2">
              Calibration réussie !
            </div>
            <div className="text-white/70 text-sm">{message}</div>
            <button
              onClick={handleClose}
              className="mt-4 w-full bg-main-green text-white py-2 px-4 rounded-lg hover:bg-main-green/90 transition-colors"
            >
              Fermer
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-4">
            <AlertTriangle className="w-8 h-8 text-critical mx-auto mb-2" />
            <div className="text-white font-medium mb-2">
              Erreur de calibration
            </div>
            <div className="text-white/70 text-sm mb-4">{message}</div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 bg-medium-grey text-main-white py-2 px-4 rounded-lg hover:bg-medium-grey/80 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={handleCalibration}
                className="flex-1 bg-main-green text-white py-2 px-4 rounded-lg hover:bg-main-green/90 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CalibrationModal;
