export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  mqtt: MqttConfig;
  openWeather: OpenWeatherConfig;
  auth: AuthConfig;
  energy: EnergyConfig;
}

export interface DatabaseConfig {
  url: string;
}

export interface MqttConfig {
  broker: string;
  doorTopic: string;
  ruuviTopic: string;
}

export interface OpenWeatherConfig {
  apiKey: string;
  lat: number;
  lon: number;
}

export interface AuthConfig {
  jwtSecret: string;
}

export interface EnergyConfig {
  doorSurfaceM2: number;
  thermalCoefficientU: number;
  energyCostPerKwh: number;
  co2EmissionsPerKwh: number;
}