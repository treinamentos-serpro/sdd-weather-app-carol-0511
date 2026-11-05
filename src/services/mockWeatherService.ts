import type { City, ForecastDay, WeatherData } from '../types/weather';

type ForecastConditions = Omit<ForecastDay, 'date'>;

function createForecast(days: ForecastConditions[]): ForecastDay[] {
  const today = new Date();

  return days.map((day, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(date.getDate()).padStart(2, '0');

    return {
      ...day,
      date: `${date.getFullYear()}-${month}-${dayOfMonth}`,
    };
  });
}

const seattle: City = {
  id: 1,
  name: 'Seattle',
  country: 'Estados Unidos',
  admin1: 'Washington',
  latitude: 47.6,
  longitude: -122.33,
};

const lisbon: City = {
  id: 2,
  name: 'Lisboa',
  country: 'Portugal',
  latitude: 38.72,
  longitude: -9.14,
};

const saoPaulo: City = {
  id: 3,
  name: 'São Paulo',
  country: 'Brasil',
  admin1: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
};

const forecast = (conditions: ForecastConditions[]) => createForecast(conditions);

export const initialMockWeather: WeatherData = {
  city: seattle,
  current: {
    time: '12:00',
    temperature: 0,
    humidity: 80,
    windSpeed: 10,
    pressure: 1015,
    precipitation: 0,
    weatherCode: 3,
  },
  forecast: forecast([
    { max: 20, min: 12, weatherCode: 3, precipitationProbability: 20 },
    { max: 19, min: 11, weatherCode: 61, precipitationProbability: 90 },
    { max: 22, min: 13, weatherCode: 80, precipitationProbability: 70 },
    { max: 24, min: 14, weatherCode: 1, precipitationProbability: 10 },
    { max: 25, min: 15, weatherCode: 0, precipitationProbability: 0 },
  ]),
};

const mockWeather: WeatherData[] = [
  initialMockWeather,
  {
    city: lisbon,
    current: {
      time: '12:00',
      temperature: 18,
      humidity: 62,
      windSpeed: 13,
      pressure: 1018,
      precipitation: 0,
      weatherCode: 1,
    },
    forecast: forecast([
      { max: 22, min: 16, weatherCode: 1, precipitationProbability: 0 },
      { max: 21, min: 15, weatherCode: 2, precipitationProbability: 10 },
      { max: 20, min: 15, weatherCode: 3, precipitationProbability: 15 },
      { max: 23, min: 16, weatherCode: 0, precipitationProbability: 0 },
      { max: 24, min: 17, weatherCode: 1, precipitationProbability: 0 },
    ]),
  },
  {
    city: saoPaulo,
    current: {
      time: '12:00',
      temperature: 24,
      humidity: 70,
      windSpeed: 12,
      pressure: 1012,
      precipitation: 0,
      weatherCode: 2,
    },
    forecast: forecast([
      { max: 27, min: 19, weatherCode: 2, precipitationProbability: 20 },
      { max: 26, min: 18, weatherCode: 61, precipitationProbability: 70 },
      { max: 25, min: 18, weatherCode: 3, precipitationProbability: 30 },
      { max: 28, min: 19, weatherCode: 1, precipitationProbability: 10 },
      { max: 29, min: 20, weatherCode: 0, precipitationProbability: 0 },
    ]),
  },
];

function normalizeCityName(name: string): string {
  return name
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR');
}

export function searchMockWeather(name: string): WeatherData | undefined {
  const query = normalizeCityName(name);
  return mockWeather.find(({ city }) => normalizeCityName(city.name) === query);
}
