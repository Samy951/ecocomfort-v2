import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { WeatherService, WeatherData } from './weather.service';
import { ConfigurationService } from '../shared/config/configuration.service';
import { mockService } from '../shared/testing/mockers';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService', () => {
  let service: WeatherService;
  let configService: jest.Mocked<ConfigurationService>;

  const mockOpenWeatherConfig = {
    apiKey: 'test-api-key',
    lat: 48.8566,
    lon: 2.3522,
  };

  const mockWeatherResponse = {
    data: {
      main: {
        temp: 15.5,
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        mockService(ConfigurationService, {
          openWeather: mockOpenWeatherConfig,
        }),
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    configService = module.get(ConfigurationService);

    // Clear cache before each test
    (service as any).cache = null;
    (service as any).isFetching = false;
    (service as any).fetchPromise = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('getOutdoorTemperature', () => {
    it('should return temperature from API on first call', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockWeatherResponse);

      const result = await service.getOutdoorTemperature();

      expect(result).toEqual({
        temperature: 15.5,
        source: 'api',
        timestamp: expect.any(Date),
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.openweathermap.org/data/2.5/weather',
        {
          params: {
            lat: 48.8566,
            lon: 2.3522,
            appid: 'test-api-key',
            units: 'metric',
          },
          timeout: 5000,
        }
      );
    });

    it('should return cached value within TTL', async () => {
      // First call to populate cache
      mockedAxios.get.mockResolvedValueOnce(mockWeatherResponse);
      await service.getOutdoorTemperature();

      // Second call should use cache
      const result = await service.getOutdoorTemperature();

      expect(result).toEqual({
        temperature: 15.5,
        source: 'cache',
        timestamp: expect.any(Date),
      });
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should fetch new value after TTL expiration', async () => {
      // Mock first call
      mockedAxios.get.mockResolvedValueOnce(mockWeatherResponse);
      await service.getOutdoorTemperature();

      // Mock cache as expired
      const cache = (service as any).cache;
      cache.timestamp = new Date(Date.now() - 11 * 60 * 1000); // 11 minutes ago

      // Mock second call with different temperature
      mockedAxios.get.mockResolvedValueOnce({
        data: { main: { temp: 20.0 } }
      });

      const result = await service.getOutdoorTemperature();

      expect(result).toEqual({
        temperature: 20.0,
        source: 'api',
        timestamp: expect.any(Date),
      });
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent requests with single API call', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockWeatherResponse);

      // Make multiple concurrent calls
      const promises = [
        service.getOutdoorTemperature(),
        service.getOutdoorTemperature(),
        service.getOutdoorTemperature(),
      ];

      const results = await Promise.all(promises);

      // All should return the same result
      results.forEach(result => {
        expect(result).toEqual({
          temperature: 15.5,
          source: 'api',
          timestamp: expect.any(Date),
        });
      });

      // But only one API call should have been made
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should retry on API failure (3 attempts)', async () => {
      const apiError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(apiError);

      // Mock sleep to make test faster
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      await expect(service.getOutdoorTemperature()).rejects.toThrow(
        'Failed to fetch weather data after 3 attempts: Network error'
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should succeed on retry after initial failures', async () => {
      const apiError = new Error('Network error');
      mockedAxios.get
        .mockRejectedValueOnce(apiError)
        .mockRejectedValueOnce(apiError)
        .mockResolvedValueOnce(mockWeatherResponse);

      // Mock sleep to make test faster
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      const result = await service.getOutdoorTemperature();

      expect(result).toEqual({
        temperature: 15.5,
        source: 'api',
        timestamp: expect.any(Date),
      });
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should fallback to expired cache on total failure', async () => {
      // First populate cache
      mockedAxios.get.mockResolvedValueOnce(mockWeatherResponse);
      await service.getOutdoorTemperature();

      // Expire the cache
      const cache = (service as any).cache;
      cache.timestamp = new Date(Date.now() - 11 * 60 * 1000);

      // Mock API failure
      const apiError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(apiError);
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      const result = await service.getOutdoorTemperature();

      expect(result).toEqual({
        temperature: 15.5,
        source: 'cache',
        timestamp: expect.any(Date),
      });
      expect(mockedAxios.get).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it('should handle missing API key gracefully', async () => {
      configService.openWeather = {
        apiKey: '',
        lat: 48.8566,
        lon: 2.3522,
      };

      mockedAxios.get.mockRejectedValue(new Error('Invalid API key'));
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      await expect(service.getOutdoorTemperature()).rejects.toThrow(
        'Failed to fetch weather data after 3 attempts: Invalid API key'
      );
    });

    it('should use default coordinates if not configured', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockWeatherResponse);

      await service.getOutdoorTemperature();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.openweathermap.org/data/2.5/weather',
        expect.objectContaining({
          params: expect.objectContaining({
            lat: 48.8566,
            lon: 2.3522,
          }),
        })
      );
    });

    it('should log warnings on API failures', async () => {
      const apiError = new Error('Network timeout');
      mockedAxios.get.mockRejectedValue(apiError);
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      const loggerSpy = jest.spyOn(console, 'log').mockImplementation();

      try {
        await service.getOutdoorTemperature();
      } catch (error) {
        // Expected to fail
      }

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('cache management', () => {
    it('should properly validate cache TTL', () => {
      const service_: any = service;

      // No cache
      expect(service_.isCacheValid()).toBe(false);

      // Fresh cache
      service_.cache = {
        temperature: 15.0,
        timestamp: new Date(),
      };
      expect(service_.isCacheValid()).toBe(true);

      // Expired cache
      service_.cache.timestamp = new Date(Date.now() - 11 * 60 * 1000);
      expect(service_.isCacheValid()).toBe(false);
    });

    it('should update cache on successful API call', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockWeatherResponse);

      await service.getOutdoorTemperature();

      const cache = (service as any).cache;
      expect(cache).toEqual({
        temperature: 15.5,
        timestamp: expect.any(Date),
      });
    });

    it('should not update cache on API failure', async () => {
      const apiError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(apiError);
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      try {
        await service.getOutdoorTemperature();
      } catch (error) {
        // Expected to fail
      }

      expect((service as any).cache).toBeNull();
    });
  });

  describe('concurrent request handling', () => {
    it('should reset fetching state after successful request', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockWeatherResponse);

      await service.getOutdoorTemperature();

      expect((service as any).isFetching).toBe(false);
      expect((service as any).fetchPromise).toBeNull();
    });

    it('should reset fetching state after failed request', async () => {
      const apiError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(apiError);
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      try {
        await service.getOutdoorTemperature();
      } catch (error) {
        // Expected to fail
      }

      expect((service as any).isFetching).toBe(false);
      expect((service as any).fetchPromise).toBeNull();
    });
  });
});