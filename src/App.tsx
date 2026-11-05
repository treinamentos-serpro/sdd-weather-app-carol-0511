import { useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import type { Unit } from './types/weather';

/**
 * WeatherView — aplicação completa de previsão do tempo.
 *
 * Construída ao longo do treinamento de Spec-Driven Development com GitHub
 * Copilot, do briefing à entrega.
 */
export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, cities, error, query, search, selectCity, retry } = useWeather();

  return (
    <div className="min-h-screen text-white">
      <a
        href="#main-content"
        className="sr-only z-50 rounded bg-night-800 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl text-sun">
              ☀️
            </span>
            <h1 className="text-lg font-bold">WeatherView</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar onSearch={search} />
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        aria-busy={status === 'loading'}
        className="mx-auto max-w-6xl space-y-8 px-4 py-8 focus:outline-none"
      >
        {cities.length > 0 && (
          <section aria-label="Resultados da busca">
            <h2 className="mb-3 text-lg font-semibold">Selecione uma cidade</h2>
            <ul className="flex flex-wrap gap-2">
              {cities.map((city) => {
                const location = [city.admin1, city.country].filter(Boolean).join(', ');
                return (
                  <li key={city.id}>
                    <button
                      type="button"
                      aria-pressed={data?.city.id === city.id}
                      onClick={() => void selectCity(city)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-left transition hover:border-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
                    >
                      <span className="block font-semibold">{city.name}</span>
                      {location && <span className="block text-sm text-white/60">{location}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {status === 'loading' ? (
          <LoadingState />
        ) : status === 'error' ? (
          <ErrorState message={error ?? 'Não foi possível concluir a consulta.'} onRetry={retry} />
        ) : status === 'empty' ? (
          <EmptyState
            title={`Nenhuma cidade encontrada para "${query}"`}
            hint="Verifique a grafia ou tente outra cidade."
          />
        ) : status === 'success' && data ? (
          <>
            <CurrentWeather city={data.city} current={data.current} unit={unit} />
            <ForecastList forecast={data.forecast} unit={unit} />
          </>
        ) : (
          <EmptyState title="Busque uma cidade para consultar o clima." />
        )}
      </main>

      <footer className="py-8 text-center text-sm text-white/70">
        Dados meteorológicos fornecidos pela Open-Meteo
      </footer>
    </div>
  );
}
