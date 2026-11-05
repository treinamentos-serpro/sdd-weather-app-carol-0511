import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import type { City, WeatherData } from '../../src/types/weather';

const { mockGetWeather, mockSearchCities } = vi.hoisted(() => ({
  mockGetWeather: vi.fn(),
  mockSearchCities: vi.fn(),
}));

vi.mock('../../src/services/weatherService', () => ({
  getWeather: mockGetWeather,
  searchCities: mockSearchCities,
  WeatherServiceError: class WeatherServiceError extends Error {},
}));

const city: City = {
  id: 1,
  name: 'Seattle',
  country: 'Estados Unidos',
  latitude: 47.6,
  longitude: -122.33,
};

const weather: WeatherData = {
  city,
  current: {
    time: '2026-06-16T12:00',
    temperature: 18,
    humidity: 80,
    windSpeed: 10,
    pressure: 1015,
    precipitation: 0,
    weatherCode: 3,
  },
  forecast: [],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('useWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('começa inativo e comunica o carregamento enquanto busca cidades', async () => {
    const pendingSearch = deferred<City[]>();
    mockSearchCities.mockReturnValue(pendingSearch.promise);
    const { result } = renderHook(() => useWeather());

    expect(result.current.status).toBe('idle');
    let search!: Promise<void>;
    act(() => {
      search = result.current.search('Seattle');
    });
    expect(result.current.status).toBe('loading');

    await act(async () => {
      pendingSearch.resolve([]);
      await search;
    });
    expect(result.current.status).toBe('empty');
  });

  it('distingue busca sem resultados de falha de serviço', async () => {
    mockSearchCities.mockRejectedValueOnce(new Error('Falha de rede'));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Seattle');
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Algo deu errado. Tente novamente.');
    expect(result.current.data).toBeNull();
  });

  it('carrega o clima da cidade escolhida e permite tentar novamente após falha', async () => {
    mockGetWeather.mockRejectedValueOnce(new Error('Falha de rede')).mockResolvedValue(weather);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.selectCity(city);
    });
    expect(result.current.status).toBe('error');
    expect(result.current.data).toBeNull();

    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(weather);
    expect(mockGetWeather).toHaveBeenCalledTimes(2);
  });

  it('não repete a consulta ao selecionar novamente a cidade já carregada', async () => {
    mockGetWeather.mockResolvedValue(weather);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.selectCity(city);
    });
    await act(async () => {
      await result.current.selectCity(city);
    });

    expect(result.current.status).toBe('success');
    expect(mockGetWeather).toHaveBeenCalledTimes(1);
  });

  it('repete a busca original ao tentar novamente após falha no geocoding', async () => {
    mockSearchCities.mockRejectedValueOnce(new Error('Falha de rede')).mockResolvedValue([city]);
    mockGetWeather.mockResolvedValue(weather);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search(' Seattle ');
    });
    expect(result.current.status).toBe('error');
    expect(result.current.query).toBe('Seattle');

    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.status).toBe('success');
    expect(mockSearchCities).toHaveBeenLastCalledWith('Seattle');
    expect(mockGetWeather).toHaveBeenCalledWith(city);
  });

  it('ignora respostas de busca anteriores à operação mais recente', async () => {
    const oldSearch = deferred<City[]>();
    const latestCity = { ...city, id: 2, name: 'Lisboa' };
    const latestWeather = { ...weather, city: latestCity };
    mockSearchCities.mockReturnValueOnce(oldSearch.promise).mockResolvedValueOnce([latestCity]);
    mockGetWeather.mockResolvedValue(latestWeather);

    const { result } = renderHook(() => useWeather());
    let oldRequest!: Promise<void>;

    await act(async () => {
      oldRequest = result.current.search('Cidade antiga');
      await result.current.search('Lisboa');
    });
    expect(result.current.data?.city.name).toBe('Lisboa');

    await act(async () => {
      oldSearch.resolve([city]);
      await oldRequest;
    });

    expect(result.current.data?.city.name).toBe('Lisboa');
    expect(mockGetWeather).toHaveBeenCalledTimes(1);
    expect(mockGetWeather).toHaveBeenCalledWith(latestCity);
  });
});
