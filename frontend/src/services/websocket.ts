// Service WebSocket simplifié pour EcoComfort

class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private subscribers: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3000/ws";
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("🔌 WebSocket connecté");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifySubscribers("connected", {});
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifySubscribers(data.type, data);
        } catch (error) {
          console.error("Erreur parsing WebSocket message:", error);
        }
      };

      this.socket.onclose = () => {
        console.log("🔌 WebSocket déconnecté");
        this.isConnected = false;
        this.notifySubscribers("disconnected", {});
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error("Erreur WebSocket:", error);
      };
    } catch (error) {
      console.error("Erreur connexion WebSocket:", error);
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
      this.socket.send(JSON.stringify({ type: eventType, data }));
    }
  }

  public initializeUser(userId: string, organizationId: string) {
    console.log(
      `👤 Initialisation utilisateur: ${userId}, organisation: ${organizationId}`
    );
    // Envoyer les informations utilisateur au serveur
    this.emit("user_init", { userId, organizationId });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.subscribers.clear();
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Instance singleton
const webSocketService = new WebSocketService();
export default webSocketService;
