import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
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
  admin1: 'Washington',
  latitude: 47.6,
  longitude: -122.33,
};

const weather: WeatherData = {
  city,
  current: {
    time: '2026-06-16T12:00',
    temperature: 0,
    humidity: 80,
    windSpeed: 10,
    pressure: 1015,
    precipitation: 0,
    weatherCode: 3,
  },
  forecast: [
    { date: '2026-06-16', max: 20, min: 12, weatherCode: 3, precipitationProbability: 20 },
    { date: '2026-06-17', max: 19, min: 11, weatherCode: 61, precipitationProbability: 90 },
    { date: '2026-06-18', max: 22, min: 13, weatherCode: 80, precipitationProbability: 70 },
    { date: '2026-06-19', max: 24, min: 14, weatherCode: 1, precipitationProbability: 10 },
    { date: '2026-06-20', max: 25, min: 15, weatherCode: 0, precipitationProbability: 0 },
  ],
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchCities.mockResolvedValue([city]);
    mockGetWeather.mockResolvedValue(weather);
  });

  it('renderiza a marca e a orientação inicial de busca', () => {
    render(<App />);
    expect(screen.getByText('WeatherView')).toBeInTheDocument();
    expect(screen.getByText(/busque uma cidade para consultar o clima/i)).toBeInTheDocument();
  });

  it('mostra a barra de busca e o alternador de unidade', () => {
    render(<App />);
    expect(screen.getByLabelText(/buscar cidade/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /unidade de temperatura/i })).toBeInTheDocument();
  });

  it('busca cidades reais pelo serviço e mostra clima e previsão', async () => {
    const user = userEvent.setup();
    render(<App />);

    const search = screen.getByLabelText(/buscar cidade/i);
    await user.type(search, 'Seattle');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    expect(await screen.findByRole('heading', { name: 'Seattle' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /previsão de 5 dias/i })).toBeInTheDocument();
    expect(mockSearchCities).toHaveBeenCalledWith('Seattle');
    expect(mockGetWeather).toHaveBeenCalledWith(city);
  });

  it('alterna a unidade do clima atual e dos cinco dias sem nova consulta', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Seattle');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await screen.findByRole('heading', { name: 'Seattle' });

    const current = screen.getByRole('region', { name: /clima atual/i });
    const forecast = screen.getByRole('region', { name: /previsão de 5 dias/i });
    expect(within(current).getByText('0°')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(within(current).getByText('32°')).toBeInTheDocument();
    const days = within(forecast).getAllByRole('listitem');
    expect(days).toHaveLength(5);
    expect(within(days[0]).getByText('68°')).toBeInTheDocument();
    expect(within(days[0]).getByText('54°')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    expect(mockGetWeather).toHaveBeenCalledTimes(1);
  });

  it('permite escolher a cidade pelo teclado e apresenta o contexto selecionado', async () => {
    const secondCity: City = {
      ...city,
      id: 2,
      name: 'Portland',
      admin1: 'Oregon',
      latitude: 45.52,
      longitude: -122.68,
    };
    mockSearchCities.mockResolvedValue([city, secondCity]);
    mockGetWeather.mockImplementation(async (selectedCity: City) => ({
      ...weather,
      city: selectedCity,
    }));
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Portland');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    const result = await screen.findByRole('button', { name: /Portland.*Oregon/i });
    result.focus();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { name: 'Portland' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: /clima atual/i })).getByText(
        'Oregon, Estados Unidos',
      ),
    ).toBeInTheDocument();
    expect(mockGetWeather).toHaveBeenLastCalledWith(secondCity);
  });

  it('mostra o estado vazio quando o serviço não encontra cidades', async () => {
    mockSearchCities.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<App />);
    const search = screen.getByLabelText(/buscar cidade/i);
    await user.clear(search);
    await user.type(search, 'Cidade inexistente');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    expect(await screen.findByText(/nenhuma cidade encontrada/i)).toBeInTheDocument();
    expect(mockGetWeather).not.toHaveBeenCalled();
  });

  it('mostra erro e permite tentar novamente', async () => {
    mockGetWeather.mockRejectedValueOnce(new Error('Falha de rede'));
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Seattle');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Algo deu errado');

    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(await screen.findByRole('heading', { name: 'Seattle' })).toBeInTheDocument();
  });

  it('mostra campos parciais como indisponíveis sem falhar a consulta', async () => {
    const partialWeather: WeatherData = {
      ...weather,
      current: {
        ...weather.current,
        temperature: null,
        weatherCode: null,
        humidity: null,
        windSpeed: null,
        pressure: null,
        precipitation: null,
      },
      forecast: weather.forecast.map((day, index) =>
        index === 0
          ? {
              ...day,
              max: null,
              min: null,
              weatherCode: null,
              precipitationProbability: null,
            }
          : day,
      ),
    };
    mockGetWeather.mockResolvedValue(partialWeather);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Seattle');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    const current = await screen.findByRole('region', { name: /clima atual/i });
    expect(within(current).getByText('Condição indisponível')).toBeInTheDocument();
    expect(within(current).getAllByText('—', { selector: 'p' })).toHaveLength(4);
    const firstForecastDay = within(
      screen.getByRole('region', { name: /previsão de 5 dias/i }),
    ).getAllByRole('listitem')[0];
    expect(within(firstForecastDay).getAllByText('—', { selector: 'span' })).toHaveLength(3);
    expect(within(firstForecastDay).getByText('—', { selector: 'p' })).toBeInTheDocument();
  });

  it('oferece navegação por link de salto para o conteúdo principal', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.tab();
    const skipLink = screen.getByRole('link', { name: /pular para o conteúdo/i });
    expect(skipLink).toHaveFocus();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    await user.keyboard('{Enter}');
    expect(window.location.hash).toBe('#main-content');
  });

  it('comunica semanticamente o carregamento enquanto a busca está pendente', async () => {
    let resolveSearch!: (cities: City[]) => void;
    mockSearchCities.mockReturnValue(
      new Promise<City[]>((resolve) => {
        resolveSearch = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Seattle');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/carregando/i);

    resolveSearch([]);
    expect(await screen.findByText(/nenhuma cidade encontrada/i)).toBeInTheDocument();
  });

  it('permite escolher entre cidades homônimas', async () => {
    const firstCity: City = { ...city, name: 'Springfield' };
    const secondCity: City = { ...city, id: 2, name: 'Springfield', admin1: 'Oregon' };
    mockSearchCities.mockResolvedValue([firstCity, secondCity]);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Springfield');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.click(await screen.findByRole('button', { name: /Springfield.*Oregon/i }));

    expect(mockGetWeather).toHaveBeenCalledWith(secondCity);
  });
});
