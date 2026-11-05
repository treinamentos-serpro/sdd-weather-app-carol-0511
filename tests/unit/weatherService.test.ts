import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const CITY: City = {
  id: 1,
  name: 'Seattle',
  country: 'Estados Unidos',
  admin1: 'Washington',
  latitude: 47.6,
  longitude: -122.33,
};

function mockFetchOnce(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  } as Response);
}

describe('weatherService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('searchCities', () => {
    it('retorna lista vazia para input vazio sem chamar a rede', async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      const result = await searchCities('   ');
      expect(result).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('mapeia resultados de geocoding', async () => {
      const fetchSpy = mockFetchOnce({
        results: [
          {
            id: 1,
            name: 'Seattle',
            country: 'Estados Unidos',
            admin1: 'Washington',
            latitude: 47.6,
            longitude: -122.33,
          },
        ],
      });
      vi.stubGlobal('fetch', fetchSpy);
      const result = await searchCities('Seattle');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Seattle');
      const url = new URL(fetchSpy.mock.calls[0][0] as string);
      expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
      expect(url.searchParams.get('name')).toBe('Seattle');
      expect(url.searchParams.get('count')).toBe('5');
      expect(url.searchParams.get('language')).toBe('pt');
      expect(url.searchParams.get('format')).toBe('json');
    });

    it('retorna vazio quando não há results', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}));
      expect(await searchCities('xyzxyz')).toEqual([]);
    });

    it('lança erro tipado em resposta não-ok', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}, false));
      await expect(searchCities('Seattle')).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it('não trata resposta inválida como uma busca vazia', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({ results: 'inválido' }));
      await expect(searchCities('Seattle')).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it('rejeita resultados de cidade incompletos', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({ results: [{ id: 1, name: 'Seattle' }] }));
      await expect(searchCities('Seattle')).rejects.toThrow('Resposta de busca inválida');
    });

    it('expõe erro HTTP e falha de rede como erro tipado', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}, false));
      await expect(searchCities('Seattle')).rejects.toThrow('Não foi possível buscar a cidade');

      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
      await expect(searchCities('Seattle')).rejects.toThrow('Falha de rede');
    });

    it('encerra a requisição no timeout com uma mensagem recuperável', async () => {
      vi.useFakeTimers();
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (_url: string, init?: RequestInit) =>
            new Promise<Response>((_resolve, reject) => {
              init?.signal?.addEventListener('abort', () => {
                reject(new DOMException('Aborted', 'AbortError'));
              });
            }),
        ),
      );

      const request = searchCities('Seattle');
      const requestExpectation = expect(request).rejects.toThrow('A requisição demorou demais');
      await vi.advanceTimersByTimeAsync(10_000);

      await requestExpectation;
    });
  });

  describe('getWeather', () => {
    it('mapeia current e daily para WeatherData', async () => {
      const fetchSpy = mockFetchOnce({
        current: {
          time: '2026-06-16T12:00',
          temperature_2m: 18,
          relative_humidity_2m: 80,
          wind_speed_10m: 10,
          surface_pressure: 1015,
          precipitation: 0,
          weather_code: 3,
        },
        daily: {
          time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
          weather_code: [3, 61, 80, 1, 0],
          temperature_2m_max: [20, 19, 22, 24, 25],
          temperature_2m_min: [12, 11, 13, 14, 15],
          precipitation_probability_max: [20, 90, 70, 10, null],
        },
      });
      vi.stubGlobal('fetch', fetchSpy);

      const data = await getWeather(CITY);
      expect(data.current.temperature).toBe(18);
      expect(data.forecast).toHaveLength(5);
      expect(data.forecast[4].precipitationProbability).toBeNull();
      const url = new URL(fetchSpy.mock.calls[0][0] as string);
      expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
      expect(url.searchParams.get('latitude')).toBe(String(CITY.latitude));
      expect(url.searchParams.get('longitude')).toBe(String(CITY.longitude));
      expect(url.searchParams.get('current')).toBe(
        'temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation,weather_code',
      );
      expect(url.searchParams.get('daily')).toBe(
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      );
      expect(url.searchParams.get('forecast_days')).toBe('5');
      expect(url.searchParams.get('timezone')).toBe('auto');
    });

    it('lança erro quando a resposta está incompleta', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({ current: null, daily: null }));
      await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it('preserva os cinco dias e normaliza campos parciais para null', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          current: { temperature_2m: null, relative_humidity_2m: 0 },
          daily: {
            time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
            weather_code: [3],
            temperature_2m_max: [0, null],
            temperature_2m_min: [12],
            precipitation_probability_max: [0],
          },
        }),
      );

      const data = await getWeather(CITY);
      expect(data.current.temperature).toBeNull();
      expect(data.current.humidity).toBe(0);
      expect(data.forecast).toHaveLength(5);
      expect(data.forecast[0]).toMatchObject({
        max: 0,
        min: 12,
        precipitationProbability: 0,
      });
      expect(data.forecast[1]).toMatchObject({
        max: null,
        min: null,
        weatherCode: null,
        precipitationProbability: null,
      });
      expect(data.forecast[4]).toMatchObject({
        max: null,
        min: null,
        weatherCode: null,
        precipitationProbability: null,
      });
    });

    it('rejeita respostas com previsão que não contém exatamente cinco dias', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          current: {
            time: '2026-06-16T12:00',
            temperature_2m: 18,
            relative_humidity_2m: 80,
            wind_speed_10m: 10,
            surface_pressure: 1015,
            precipitation: 0,
            weather_code: 3,
          },
          daily: {
            time: ['2026-06-16'],
            weather_code: [3],
            temperature_2m_max: [20],
            temperature_2m_min: [12],
            precipitation_probability_max: [20],
          },
        }),
      );
      await expect(getWeather(CITY)).rejects.toThrow('Resposta de clima inválida');
    });

    it('distingue falha HTTP ao consultar o clima', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}, false));
      await expect(getWeather(CITY)).rejects.toThrow('Não foi possível carregar o clima');
    });
  });
});
