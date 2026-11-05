import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

/** Erro tipado da camada de dados, com mensagem amigável ao usuário. */
export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

/** Faz um fetch com timeout via AbortController. */
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (isRecord(err) && err.name === 'AbortError') {
      throw new WeatherServiceError('A requisição demorou demais. Tente novamente.');
    }
    throw new WeatherServiceError('Falha de rede. Verifique sua conexão.');
  } finally {
    clearTimeout(timeout);
  }
}

interface GeocodingResult {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isGeocodingResult(value: unknown): value is GeocodingResult {
  if (!isRecord(value)) return false;
  return (
    isFiniteNumber(value.id) &&
    typeof value.name === 'string' &&
    (value.country === undefined || typeof value.country === 'string') &&
    (value.admin1 === undefined || typeof value.admin1 === 'string') &&
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude)
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new WeatherServiceError('A resposta do serviço é inválida. Tente novamente.');
  }
}

/**
 * Busca cidades por nome (geocoding). Retorna lista vazia quando não há
 * resultados — o estado "vazio" é tratado pela camada de UI.
 */
export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new WeatherServiceError('Não foi possível buscar a cidade. Tente novamente.');
  }

  const data = await readJson(res);
  if (!isRecord(data)) {
    throw new WeatherServiceError('Resposta de busca inválida. Tente novamente.');
  }
  if (!('results' in data)) return [];
  if (!Array.isArray(data.results)) {
    throw new WeatherServiceError('Resposta de busca inválida. Tente novamente.');
  }
  if (!data.results.every(isGeocodingResult)) {
    throw new WeatherServiceError('Resposta de busca inválida. Tente novamente.');
  }

  return data.results.map((r) => ({
    id: r.id,
    name: r.name,
    country: r.country ?? '',
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

function isForecastDaily(value: unknown): value is Record<string, unknown> & { time: string[] } {
  if (!isRecord(value)) return false;
  return Array.isArray(value.time) && value.time.every(isValidIsoDate) && value.time.length === 5;
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function optionalNumber(value: unknown): number | null {
  return isFiniteNumber(value) ? value : null;
}

function arrayNumber(value: unknown, index: number): number | null {
  return Array.isArray(value) ? optionalNumber(value[index]) : null;
}

function mapCurrent(value: unknown): CurrentWeather {
  const c = isRecord(value) ? value : {};
  return {
    time: typeof c.time === 'string' ? c.time : null,
    temperature: optionalNumber(c.temperature_2m),
    humidity: optionalNumber(c.relative_humidity_2m),
    windSpeed: optionalNumber(c.wind_speed_10m),
    pressure: optionalNumber(c.surface_pressure),
    precipitation: optionalNumber(c.precipitation),
    weatherCode: optionalNumber(c.weather_code),
  };
}

function mapForecast(d: Record<string, unknown> & { time: string[] }): ForecastDay[] {
  return d.time.map((date, i) => ({
    date,
    weatherCode: arrayNumber(d.weather_code, i),
    max: arrayNumber(d.temperature_2m_max, i),
    min: arrayNumber(d.temperature_2m_min, i),
    precipitationProbability: arrayNumber(d.precipitation_probability_max, i),
  }));
}

/**
 * Busca o clima atual e a previsão de 5 dias para uma cidade.
 * Temperaturas retornam em Celsius (conversão fica na UI).
 */
export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '5',
    timezone: 'auto',
  });

  const res = await fetchWithTimeout(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new WeatherServiceError('Não foi possível carregar o clima. Tente novamente.');
  }

  const data = await readJson(res);
  if (!isRecord(data) || !isForecastDaily(data.daily)) {
    throw new WeatherServiceError('Resposta de clima inválida ou incompleta. Tente novamente.');
  }

  return {
    city,
    current: mapCurrent(data.current),
    forecast: mapForecast(data.daily),
  };
}
