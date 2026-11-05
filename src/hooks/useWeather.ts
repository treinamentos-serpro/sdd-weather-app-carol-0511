import { useCallback, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface UseWeatherResult {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

/**
 * Hook de orquestração: busca cidades, seleciona uma e carrega o clima.
 * Expõe uma máquina de estados simples (idle/loading/success/error/empty).
 */
export function useWeather(): UseWeatherResult {
  const [status, setStatus] = useState<WeatherStatus>('idle');
  const [data, setData] = useState<WeatherData | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [lastCity, setLastCity] = useState<City | null>(null);
  const requestId = useRef(0);

  const loadWeather = useCallback(async (city: City, operationId: number) => {
    if (operationId !== requestId.current) return;
    setStatus('loading');
    setError(null);
    setLastCity(city);
    try {
      const weather = await getWeather(city);
      if (operationId !== requestId.current) return;
      setData(weather);
      setStatus('success');
    } catch (err) {
      if (operationId !== requestId.current) return;
      setStatus('error');
      setError(toMessage(err));
    }
  }, []);

  const search = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      const operationId = ++requestId.current;
      setQuery(trimmed);
      setLastCity(null);
      setCities([]);
      setError(null);
      if (!trimmed) {
        setStatus('idle');
        return;
      }

      setStatus('loading');
      try {
        const results = await searchCities(trimmed);
        if (operationId !== requestId.current) return;
        setCities(results);
        if (results.length === 0) {
          setStatus('empty');
          return;
        }
        await loadWeather(results[0], operationId);
      } catch (err) {
        if (operationId !== requestId.current) return;
        setStatus('error');
        setError(toMessage(err));
      }
    },
    [loadWeather],
  );

  const selectCity = useCallback(
    async (city: City) => {
      if (status === 'success' && data?.city.id === city.id) return;
      const operationId = ++requestId.current;
      await loadWeather(city, operationId);
    },
    [data, loadWeather, status],
  );

  const retry = useCallback(async () => {
    if (lastCity) {
      const operationId = ++requestId.current;
      await loadWeather(lastCity, operationId);
    } else if (query) {
      await search(query);
    }
  }, [lastCity, query, loadWeather, search]);

  return { status, data, cities, error, query, search, selectCity, retry };
}

function toMessage(err: unknown): string {
  if (err instanceof WeatherServiceError) return err.message;
  return 'Algo deu errado. Tente novamente.';
}
