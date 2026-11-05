import { expect, type Page, test } from '@playwright/test';

const cities = {
  results: [
    {
      id: 1,
      name: 'Portland',
      country: 'Estados Unidos',
      admin1: 'Maine',
      latitude: 43.66,
      longitude: -70.25,
    },
    {
      id: 2,
      name: 'Portland',
      country: 'Estados Unidos',
      admin1: 'Oregon',
      latitude: 45.52,
      longitude: -122.68,
    },
  ],
};

function forecast(currentTemperature: number) {
  return {
    current: {
      time: '2026-06-16T12:00',
      temperature_2m: currentTemperature,
      relative_humidity_2m: 80,
      wind_speed_10m: 10,
      surface_pressure: 1015,
      precipitation: 0,
      weather_code: 3,
    },
    daily: {
      time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
      weather_code: [3, 61, 80, 1, 0],
      temperature_2m_max: [25, 19, 22, 24, 25],
      temperature_2m_min: [15, 11, 13, 14, 15],
      precipitation_probability_max: [20, 90, 70, 10, 0],
    },
  };
}

async function mockCities(page: Page) {
  await page.route('**/geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: cities }),
  );
}

async function mockForecast(page: Page, response: (latitude: string | null) => unknown) {
  await page.route('**/api.open-meteo.com/**', (route) => {
    const latitude = new URL(route.request().url()).searchParams.get('latitude');
    return route.fulfill({ json: response(latitude) });
  });
}

test('busca, seleciona cidade homônima, mostra os dados correspondentes e alterna toda a previsão', async ({
  page,
}) => {
  let forecastRequests = 0;
  await mockCities(page);
  await mockForecast(page, (latitude) => {
    forecastRequests += 1;
    return forecast(latitude === '45.52' ? 20 : 4);
  });
  await page.goto('/');

  const search = page.getByLabel(/buscar cidade/i);
  await search.fill('Portland');
  await search.press('Enter');

  const oregonResult = page.getByRole('button', { name: /Portland.*Oregon/i });
  await expect(oregonResult).toBeVisible();
  await oregonResult.focus();
  await page.keyboard.press('Enter');

  const currentWeather = page.getByRole('region', { name: /clima atual/i });
  const dailyForecast = page.getByRole('region', { name: /previsão de 5 dias/i });
  await expect(currentWeather.getByText('Oregon, Estados Unidos')).toBeVisible();
  await expect(currentWeather.getByText('20°')).toBeVisible();
  await expect(dailyForecast.getByRole('listitem')).toHaveCount(5);

  const fahrenheit = page.getByRole('button', { name: '°F' });
  await fahrenheit.focus();
  await page.keyboard.press('Enter');
  await expect(currentWeather.getByText('68°')).toBeVisible();
  const days = dailyForecast.getByRole('listitem');
  await expect(days.nth(0).getByText('77°')).toBeVisible();
  await expect(days.nth(0).getByText('59°')).toBeVisible();
  await expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
  expect(forecastRequests).toBe(2);
});

test('busca sem resultados apresenta estado vazio', async ({ page }) => {
  await page.route('**/geocoding-api.open-meteo.com/**', (route) => route.fulfill({ json: {} }));
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('xyzxyz');
  await page.getByRole('button', { name: /buscar/i }).click();

  await expect(page.getByText(/nenhuma cidade encontrada/i)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('falha de busca e resultado vazio são estados distintos e a busca pode ser repetida', async ({
  page,
}) => {
  let searches = 0;
  await page.route('**/geocoding-api.open-meteo.com/**', (route) => {
    searches += 1;
    return searches === 1
      ? route.fulfill({ status: 503, body: 'indisponível' })
      : route.fulfill({ json: {} });
  });
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Portland');
  await page.getByRole('button', { name: /buscar/i }).click();
  await expect(page.getByRole('alert')).toContainText(/não foi possível buscar/i);

  await page.getByRole('button', { name: /tentar novamente/i }).click();
  await expect(page.getByText(/nenhuma cidade encontrada/i)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(searches).toBe(2);
});

test('falha de clima permite retry e não apresenta a falha como sucesso', async ({ page }) => {
  let forecastRequests = 0;
  await mockCities(page);
  await page.route('**/api.open-meteo.com/**', async (route) => {
    forecastRequests += 1;
    if (forecastRequests === 1) {
      await route.fulfill({ status: 503, body: 'indisponível' });
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    await route.fulfill({ json: forecast(20) });
  });
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Portland');
  await page.getByRole('button', { name: /buscar/i }).click();
  await expect(page.getByRole('alert')).toContainText(/não foi possível carregar o clima/i);
  await expect(page.getByRole('region', { name: /clima atual/i })).toHaveCount(0);

  await page.getByRole('button', { name: /tentar novamente/i }).click();
  await expect(page.getByRole('status')).toContainText(/carregando/i);
  await expect(page.getByRole('region', { name: /clima atual/i })).toBeVisible();
  expect(forecastRequests).toBe(2);
});

test('o atalho de teclado leva ao conteúdo principal', async ({ page }) => {
  await page.goto('/');

  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.getByRole('main')).toBeFocused();
});

test('fluxo mobile conclui busca e troca de unidade sem rolagem horizontal', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Valida o projeto mobile em viewport de celular.');
  await page.setViewportSize({ width: 375, height: 812 });
  await mockCities(page);
  await mockForecast(page, () => forecast(0));
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Portland');
  await page.getByRole('button', { name: /buscar/i }).click();
  await expect(page.getByRole('heading', { name: 'Portland' })).toBeVisible();
  await page.getByRole('button', { name: '°F' }).click();
  await expect(page.getByRole('region', { name: /clima atual/i }).getByText('32°')).toBeVisible();

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
