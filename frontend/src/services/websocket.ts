// Service WebSocket avec Socket.IO pour EcoComfort
import { io, Socket } from "socket.io-client";
import type {
  WebSocketEventData,
  DoorStateChangedData,
  SensorDataUpdatedData,
  PointsAwardedData,
  BadgeAwardedData,
  LevelUpData,
} from "../types";

function httpOriginToWs(origin: string): string {
  try {
    const url = new URL(origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.toString().replace(/\/$/, "");
  } catch {
    return origin.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
  }
}

type EventMap = {
  connected: { socketId: string };
  disconnected: { reason: string };
  "door-state-changed": DoorStateChangedData;
  "sensor-data-updated": SensorDataUpdatedData;
  "points-awarded": PointsAwardedData;
  "badge-awarded": BadgeAwardedData;
  "level-up": LevelUpData;
};

type EventName = keyof EventMap;

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private subscribers: Map<
    EventName,
    Set<(payload: EventMap[EventName]) => void>
  > = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pendingUserInit: { userId: string; organizationId: string } | null =
    null;
  private lastUserInit: { userId: string; organizationId: string } | null =
    null;
  private shouldReconnect = true;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const envUrl = import.meta.env.VITE_WS_URL as string | undefined;
      const httpOrigin =
        import.meta.env.VITE_API_ORIGIN || "http://localhost:3000";
      const socketUrl =
        envUrl && envUrl.length > 0 ? envUrl : httpOriginToWs(httpOrigin);

      if (import.meta.env.DEV) {
        console.log("🔌 Tentative de connexion Socket.IO:", socketUrl);
      }

      this.socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
        reconnection: false,
      });

      this.socket.on("connect", () => {
        if (import.meta.env.DEV) {
          console.log("🔌 Socket.IO connecté:", this.socket?.id);
        }
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.shouldReconnect = true;
        this.notifySubscribers("connected", {
          socketId: this.socket?.id || "",
        });

        if (this.pendingUserInit) {
          if (import.meta.env.DEV) {
            console.log(
              "👤 Envoi de l'initialisation utilisateur différée:",
              this.pendingUserInit
            );
          }
          this.emit("user_init", this.pendingUserInit);
          this.lastUserInit = this.pendingUserInit;
          this.pendingUserInit = null;
        } else if (this.lastUserInit) {
          if (import.meta.env.DEV) {
            console.log(
              "👤 Ré-émission de l'initialisation utilisateur persistée:",
              this.lastUserInit
            );
          }
          this.emit("user_init", this.lastUserInit);
        }
      });

      this.socket.on("disconnect", (reason) => {
        if (import.meta.env.DEV) {
          console.log("🔌 Socket.IO déconnecté:", reason);
        }
        this.isConnected = false;
        this.notifySubscribers("disconnected", { reason });
        if (this.shouldReconnect) this.handleReconnect();
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Erreur connexion Socket.IO:", error);
        this.isConnected = false;
        if (this.shouldReconnect) this.handleReconnect();
      });

      this.socket.on("door-state-changed", (data) => {
        if (import.meta.env.DEV) console.log("🚪 État porte changé:", data);
        this.notifySubscribers("door-state-changed", data);
      });

      this.socket.on("sensor-data-updated", (data) => {
        if (import.meta.env.DEV)
          console.log("📊 Données capteur mises à jour:", data);
        this.notifySubscribers("sensor-data-updated", data);
      });

      this.socket.on("points-awarded", (data) => {
        if (import.meta.env.DEV) console.log("🏆 Points attribués:", data);
        this.notifySubscribers("points-awarded", data);
      });

      this.socket.on("badge-awarded", (data) => {
        if (import.meta.env.DEV) console.log("🎖️ Badge attribué:", data);
        this.notifySubscribers("badge-awarded", data);
      });

      this.socket.on("level-up", (data) => {
        if (import.meta.env.DEV) console.log("⬆️ Montée de niveau:", data);
        this.notifySubscribers("level-up", data);
      });
    } catch (error) {
      console.error("Erreur connexion Socket.IO:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      setTimeout(() => {
        if (import.meta.env.DEV) {
          console.log(
            `🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
          );
        }
        this.connect();
      }, delay);
    } else {
      console.warn("⚠️ Nombre maximum de tentatives de reconnexion atteint");
    }
  }

  private notifySubscribers<E extends EventName>(
    eventType: E,
    data: EventMap[E]
  ) {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Erreur dans callback WebSocket:", error);
        }
      });
    }
  }

  public on<E extends EventName>(
    eventType: E,
    callback: (payload: EventMap[E]) => void
  ) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    (
      this.subscribers.get(eventType) as Set<(payload: EventMap[E]) => void>
    ).add(callback);
    return () => {
      const subscribers = this.subscribers.get(eventType);
      if (subscribers) {
        (subscribers as Set<(payload: EventMap[E]) => void>).delete(callback);
        if (subscribers.size === 0) this.subscribers.delete(eventType);
      }
    };
  }

  public emit(
    eventType: string,
    data: WebSocketEventData | { userId: string; organizationId: string }
  ) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventType, data);
    } else {
      if (import.meta.env.DEV)
        console.warn(
          "⚠️ Socket.IO non connecté, impossible d'émettre:",
          eventType
        );
    }
  }

  public initializeUser(userId: string, organizationId: string) {
    if (import.meta.env.DEV) {
      console.log(
        `👤 Initialisation utilisateur: ${userId}, organisation: ${organizationId}`
      );
    }
    if (this.isConnected && this.socket) {
      this.emit("user_init", { userId, organizationId });
      this.lastUserInit = { userId, organizationId };
    } else {
      if (import.meta.env.DEV)
        console.log(
          "⏳ Connexion Socket.IO en cours, initialisation différée..."
        );
      this.pendingUserInit = { userId, organizationId };
      this.lastUserInit = { userId, organizationId };
    }
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.subscribers.clear();
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
