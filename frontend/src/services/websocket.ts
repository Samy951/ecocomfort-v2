// Service WebSocket avec Socket.IO pour EcoComfort
import { io, Socket } from "socket.io-client";
import { WS_URL } from "../config";

/**
 * Singleton wrapper around Socket.IO.
 * Provides subscribe/emit helpers, basic exponential backoff reconnection,
 * and defers user initialization until connected.
 */
class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private subscribers: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingUserInit: { userId: string; organizationId: string } | null =
    null;
  private lastUserInit: { userId: string; organizationId: string } | null =
    null;
  private shouldReconnect = true;

  constructor() {
    // WebSocket activé - backend Socket.IO disponible
    this.connect();
  }

  private connect() {
    try {
      // URL Socket.IO du backend
      const socketUrl = WS_URL;

      if (import.meta.env.DEV) {
        console.log("🔌 Tentative de connexion Socket.IO:", socketUrl);
      }

      if (this.isConnecting || this.isConnected) return;
      this.isConnecting = true;
      if (this.socket) {
        try {
          this.socket.removeAllListeners?.();
        } catch {}
        this.socket.disconnect();
        this.socket = null;
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
        this.isConnecting = false;
        this.shouldReconnect = true;
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.notifySubscribers("connected", { socketId: this.socket?.id });

        // Envoyer l'initialisation utilisateur différée si elle existe, sinon réémettre la dernière connue
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
        this.isConnecting = false;
        if (this.shouldReconnect) this.handleReconnect();
      });

      // Écouter les événements spécifiques du backend
      this.socket.on("door-state-changed", (data) => {
        if (import.meta.env.DEV) {
          console.log("🚪 État porte changé:", data);
        }
        this.notifySubscribers("door-state-changed", data);
      });

      this.socket.on("sensor-data-updated", (data) => {
        if (import.meta.env.DEV) {
          console.log("📊 Données capteur mises à jour:", data);
        }
        this.notifySubscribers("sensor-data-updated", data);
      });

      this.socket.on("points-awarded", (data) => {
        if (import.meta.env.DEV) {
          console.log("🏆 Points attribués:", data);
        }
        this.notifySubscribers("points-awarded", data);
      });

      this.socket.on("badge-awarded", (data) => {
        if (import.meta.env.DEV) {
          console.log("🎖️ Badge attribué:", data);
        }
        this.notifySubscribers("badge-awarded", data);
      });

      this.socket.on("level-up", (data) => {
        if (import.meta.env.DEV) {
          console.log("⬆️ Montée de niveau:", data);
        }
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

      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        if (import.meta.env.DEV) {
          console.log(
            `🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
          );
        }
        this.connect();
      }, delay);
    } else {
      console.warn("⚠️ Nombre maximum de tentatives de reconnexion atteint");
      this.notifySubscribers("reconnect_failed", {});
    }
  }

  private notifySubscribers(eventType: string, data: any) {
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

  /** Subscribe to a socket event. Returns an unsubscribe function. */
  public on(eventType: string, callback: Function) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(callback);

    // Retourner une fonction de désabonnement
    return () => {
      const subscribers = this.subscribers.get(eventType);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  /** Emit an event if connected; otherwise logs a warning. */
  public emit(eventType: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventType, data);
    } else {
      if (import.meta.env.DEV) {
        console.warn(
          "⚠️ Socket.IO non connecté, impossible d'émettre:",
          eventType
        );
      }
    }
  }

  /** Queue or send the user initialization payload when connected. */
  public initializeUser(userId: string, organizationId: string) {
    if (import.meta.env.DEV) {
      console.log(
        `👤 Initialisation utilisateur: ${userId}, organisation: ${organizationId}`
      );
    }

    // Attendre que la connexion soit établie avant d'émettre
    if (this.isConnected && this.socket) {
      this.emit("user_init", { userId, organizationId });
      this.lastUserInit = { userId, organizationId };
    } else {
      if (import.meta.env.DEV) {
        console.log(
          "⏳ Connexion Socket.IO en cours, initialisation différée..."
        );
      }
      // Stocker les données utilisateur pour les envoyer une fois connecté
      this.pendingUserInit = { userId, organizationId };
      this.lastUserInit = { userId, organizationId };
    }
  }

  /** Fully tear down the socket connection and timers. */
  public disconnect() {
    this.shouldReconnect = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.subscribers.clear();
  }

  /** Current connection status flag. */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /** Socket id when connected. */
  public getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Instance singleton
const webSocketService = new WebSocketService();
export default webSocketService;
