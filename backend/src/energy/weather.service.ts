import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigurationService } from '../shared/config/configuration.service';

export interface WeatherData {
  temperature: number;
  source: 'api' | 'cache';
  timestamp: Date;
}

interface CacheEntry {
  temperature: number;
  timestamp: Date;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private cache: CacheEntry | null = null;
  private isFetching = false;
  private fetchPromise: Promise<WeatherData> | null = null;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(private configService: ConfigurationService) {}

  async getOutdoorTemperature(): Promise<WeatherData> {
    // Check if cache is valid
    if (this.cache && this.isCacheValid()) {
      return {
        temperature: this.cache.temperature,
        source: 'cache',
        timestamp: this.cache.timestamp,
      };
    }

    // If fetch is already in progress, wait for it
    if (this.isFetching && this.fetchPromise) {
      return this.fetchPromise;
    }

    // Start new fetch
    this.isFetching = true;
    this.fetchPromise = this.fetchFromAPI();

    try {
      const result = await this.fetchPromise;
      return result;
    } finally {
      this.isFetching = false;
      this.fetchPromise = null;
    }
  }

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp.getTime() < this.CACHE_TTL;
  }

  private async fetchFromAPI(): Promise<WeatherData> {
    const { apiKey, lat, lon } = this.configService.openWeather;
    const url = 'https://api.openweathermap.org/data/2.5/weather';

    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await axios.get(url, {
          params: {
            lat,
            lon,
            appid: apiKey,
            units: 'metric',
          },
          timeout: 5000,
        });

        const temperature = response.data.main.temp;
        const timestamp = new Date();

        // Update cache
        this.cache = { temperature, timestamp };

        return {
          temperature,
          source: 'api',
          timestamp,
        };
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`OpenWeather API call failed (attempt ${attempt}/3): ${error.message}`);

        if (attempt < 3) {
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          await this.sleep(delay);
        }
      }
    }

    // All retries failed, try fallback to expired cache
    if (this.cache) {
      this.logger.log('Using expired cache as fallback after API failure');
      return {
        temperature: this.cache.temperature,
        source: 'cache',
        timestamp: this.cache.timestamp,
      };
    }

    // No cache available, throw error
    throw new Error(`Failed to fetch weather data after 3 attempts: ${lastError?.message}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}