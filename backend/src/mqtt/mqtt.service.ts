import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { connect, MqttClient } from 'mqtt';
import { ConfigurationService } from '../shared/config/configuration.service';

type MessageHandler = (topic: string, payload: Buffer) => void;

interface IMqttService {
  isConnected(): boolean;
  onMessage(topicPattern: string, handler: MessageHandler): void;
  offMessage(topicPattern: string, handler: MessageHandler): void;
  publish(topic: string, payload: string | Buffer): Promise<void>;
}

@Injectable()
export class MqttService implements IMqttService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: MqttClient | null = null;
  private messageHandlers = new Map<string, Set<MessageHandler>>();
  private reconnectAttempts = 0;
  private messageStats = new Map<string, number>();

  constructor(private configService: ConfigurationService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const mqttConfig = this.configService.mqtt;

      const options = {
        reconnectPeriod: 10000,
        connectTimeout: 30000,
        keepalive: 60,
        clean: true,
        clientId: `ecocomfort-backend-${Date.now()}`,
      };

      this.client = connect(mqttConfig.broker, options);

      this.client.on('connect', () => {
        this.logger.log(`Connected to broker at ${mqttConfig.broker}`);
        this.reconnectAttempts = 0;
        this.subscribeToConfiguredTopics();
      });

      this.client.on('disconnect', () => {
        this.logger.log('Disconnected from broker');
      });

      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        this.logger.warn(`Attempting reconnection... (#${this.reconnectAttempts})`);
      });

      this.client.on('error', (error) => {
        this.logger.error(`Error: ${error.message}`);
      });

      this.client.on('message', (topic, payload, packet) => {
        const now = new Date();
        const timestamp = now.toISOString();
        const fullPayload = payload.toString();

        // Update message statistics
        const count = this.messageStats.get(topic) || 0;
        this.messageStats.set(topic, count + 1);

        // Enhanced debug logging
        if (process.env.LOG_LEVEL === 'debug') {
          this.logger.debug(`[${timestamp}] Topic: ${topic}`);
          this.logger.debug(`[${timestamp}] Payload: ${fullPayload}`);
          this.logger.debug(`[${timestamp}] Retained: ${packet.retain}`);
          this.logger.debug(`[${timestamp}] Message count for topic: ${this.messageStats.get(topic)}`);
        } else {
          // Standard logging
          if (packet.retain) {
            this.logger.log(`Received RETAINED message on ${topic}: ${fullPayload.slice(0, 100)}`);
          } else {
            this.logger.log(`Received message on ${topic}: ${fullPayload.slice(0, 100)}`);
          }
        }

        const startTime = Date.now();
        this.distributeMessage(topic, payload);
        const processingTime = Date.now() - startTime;

        if (process.env.LOG_LEVEL === 'debug') {
          this.logger.debug(`[${timestamp}] Processing time: ${processingTime}ms`);
        }
      });

    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      this.logger.warn('[MqttService] Running in degraded mode - No MQTT connection');
    }
  }

  private subscribeToConfiguredTopics(): void {
    if (!this.client) return;

    const mqttConfig = this.configService.mqtt;
    const topics = [mqttConfig.doorTopic, mqttConfig.ruuviTopic];

    topics.forEach(topic => {
      // Subscribe with QoS 1 to ensure message delivery and receive retained messages
      this.client!.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          this.logger.error(`Failed to subscribe to ${topic}: ${error.message}`);
        } else {
          this.logger.log(`Subscribed to ${topic} (QoS 1, retained messages enabled)`);
        }
      });
    });

    this.logger.log(`Subscribed to topics: ${topics.join(', ')}`);
  }

  private distributeMessage(topic: string, payload: Buffer): void {
    this.messageHandlers.forEach((handlers, pattern) => {
      if (this.topicMatches(topic, pattern)) {
        handlers.forEach(handler => {
          try {
            handler(topic, payload);
          } catch (error) {
            this.logger.error(`Handler error for topic ${topic}: ${error.message}`);
          }
        });
      }
    });
  }

  private topicMatches(topic: string, pattern: string): boolean {
    if (pattern === topic) return true;

    // Handle MQTT wildcards
    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    if (patternParts.length !== topicParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '+') continue;
      if (patternParts[i] !== topicParts[i]) return false;
    }

    return true;
  }

  private async disconnect(): Promise<void> {
    if (this.client) {
      await new Promise<void>((resolve) => {
        this.client!.end(false, {}, () => {
          this.logger.log('MQTT client disconnected');
          resolve();
        });
      });
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  onMessage(topicPattern: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(topicPattern)) {
      this.messageHandlers.set(topicPattern, new Set());
    }
    this.messageHandlers.get(topicPattern)!.add(handler);
  }

  offMessage(topicPattern: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(topicPattern);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(topicPattern);
      }
    }
  }

  async publish(topic: string, payload: string | Buffer): Promise<void> {
    if (!this.client || !this.isConnected()) {
      throw new Error('MQTT client not connected');
    }

    return new Promise((resolve, reject) => {
      this.client!.publish(topic, payload, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}