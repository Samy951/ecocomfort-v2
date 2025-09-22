// Service WebSocket avec Socket.IO pour EcoComfort
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private subscribers: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pendingUserInit: { userId: string; organizationId: string } | null = null;

  constructor() {
    // WebSocket activé - backend Socket.IO disponible
    this.connect();
  }

  private connect() {
    try {
      // URL Socket.IO du backend
      const socketUrl = import.meta.env.VITE_WS_URL || "http://localhost:3000";
      
      console.log("🔌 Tentative de connexion Socket.IO:", socketUrl);
      
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log("🔌 Socket.IO connecté:", this.socket?.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifySubscribers("connected", { socketId: this.socket?.id });
        
        // Envoyer l'initialisation utilisateur différée si elle existe
        if (this.pendingUserInit) {
          console.log("👤 Envoi de l'initialisation utilisateur différée:", this.pendingUserInit);
          this.emit("user_init", this.pendingUserInit);
          this.pendingUserInit = null;
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log("🔌 Socket.IO déconnecté:", reason);
        this.isConnected = false;
        this.notifySubscribers("disconnected", { reason });
        this.handleReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error("❌ Erreur connexion Socket.IO:", error);
        this.isConnected = false;
        this.handleReconnect();
      });

      // Écouter les événements spécifiques du backend
      this.socket.on('door-state-changed', (data) => {
        console.log("🚪 État porte changé:", data);
        this.notifySubscribers("door-state-changed", data);
      });

      this.socket.on('sensor-data-updated', (data) => {
        console.log("📊 Données capteur mises à jour:", data);
        this.notifySubscribers("sensor-data-updated", data);
      });

      this.socket.on('points-awarded', (data) => {
        console.log("🏆 Points attribués:", data);
        this.notifySubscribers("points-awarded", data);
      });

      this.socket.on('badge-awarded', (data) => {
        console.log("🎖️ Badge attribué:", data);
        this.notifySubscribers("badge-awarded", data);
      });

      this.socket.on('level-up', (data) => {
        console.log("⬆️ Montée de niveau:", data);
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
        console.log(
          `🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
        );
        this.connect();
      }, delay);
    } else {
      console.warn("⚠️ Nombre maximum de tentatives de reconnexion atteint");
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

  // Méthodes publiques
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

  public emit(eventType: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventType, data);
    } else {
      console.warn("⚠️ Socket.IO non connecté, impossible d'émettre:", eventType);
    }
  }

  public initializeUser(userId: string, organizationId: string) {
    console.log(
      `👤 Initialisation utilisateur: ${userId}, organisation: ${organizationId}`
    );
    
    // Attendre que la connexion soit établie avant d'émettre
    if (this.isConnected && this.socket) {
      this.emit("user_init", { userId, organizationId });
    } else {
      console.log("⏳ Connexion Socket.IO en cours, initialisation différée...");
      // Stocker les données utilisateur pour les envoyer une fois connecté
      this.pendingUserInit = { userId, organizationId };
    }
  }

  public disconnect() {
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

// Instance singleton
const webSocketService = new WebSocketService();
export default webSocketService;
