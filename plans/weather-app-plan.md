# Plano técnico — Aplicação de previsão do tempo

> **Status deste plano:** proposta técnica derivada de uma especificação que também
> permanece **proposta para validação**. Os itens marcados como provisórios não são
> requisitos aprovados. Decisões dependentes das perguntas em aberto devem ser
> confirmadas antes de fechar contratos de UI/API ou critérios de aceite.

## 1. Architecture Overview

Arquitetura simples de aplicação web cliente, separada em apresentação, estado de
interface, serviços de acesso a dados e adaptação dos contratos externos:

```text
Pessoa usuária
   │ busca / seleção / unidade
   ▼
React UI (Search, Weather, Forecast, estados)
   │ eventos e leitura de estado
   ▼
useWeather / estado da tela
   │ operações assíncronas
   ▼
weatherService ──► adaptadores e validação de respostas
   │                         │
   ├── geocoding              └── normalização para contratos internos
   └── forecast
             │
             ▼
      fonte meteorológica externa
```

- **Apresentação:** componentes React renderizam busca, resultados, clima,
  previsão, unidade e estados de carregamento/erro/vazio. A interface adapta-se a
  telas móveis e fornece controles utilizáveis por teclado e tecnologias
  assistivas (FR-01–FR-05, NFR-01, NFR-02).
- **Estado de tela:** um hook ou estado local do `App` coordena consulta, cidade
  selecionada, dados e unidade; não há indicação de necessidade de store global
  (FR-02, FR-05, FR-07/08).
- **Serviços/adaptadores:** concentram chamadas HTTP, tratamento de resposta,
  normalização e mapeamento de falhas para não acoplar componentes ao fornecedor
  (FR-01–FR-04, NFR-04, NFR-07).
- **Persistência/backend:** não propostos para a primeira versão. A necessidade de
  persistir unidade, cache, histórico ou outros dados não está decidida; não
  armazenar esses dados até haver aprovação (AC-04.3, NFR-04, NFR-06; R-08).

**Rastreabilidade:** a consulta e exibição correspondem a FR-01–FR-04 e
AC-01.1–AC-03.3; unidade, a FR-05/FR-06 e AC-04.1–AC-04.3; os estados e retry
correspondem a FR-07/FR-08 e AC-06.1–AC-07.2 (estes requisitos são inferidos e
propostos para validação); contexto de cidade, a FR-09/AC-01.3, também sujeito à
definição dos campos identificadores.

## 2. Tech Stack

| Tecnologia | Uso proposto e justificativa | Rastreabilidade / ressalvas |
|---|---|---|
| React + TypeScript | Interface baseada em componentes e contratos tipados, coerente com a base do projeto e suficiente para uma tela de consulta. | FR-01–FR-06; AC-05.1; não determina decisões de produto pendentes. |
| Vite | Servidor de desenvolvimento e build simples para a aplicação cliente. | Apoia entrega e feedback, sem criar requisito funcional novo. |
| CSS responsivo; Tailwind CSS se mantido na base | Layout mobile-first e estados visuais. Usar estilos simples e tokens; não escolher biblioteca visual adicional sem necessidade. | NFR-01, AC-05.1–AC-05.3; a matriz de dispositivos está pendente. |
| `fetch` (ou cliente HTTP nativo equivalente) | Requisições assíncronas sem adicionar dependência de rede. Encapsular em serviço para facilitar testes e troca de fonte. | FR-01–FR-04, NFR-03/04/07. |
| Vitest + Testing Library | Testes unitários e de componentes no ecossistema Vite. | Estratégia exigida pelo prompt e alinhada aos estados/fluxos FR-07/08. |
| Playwright | Testes E2E dos fluxos principais em navegadores/tamanhos acordados. | AC-01.*, AC-04.*, AC-05.* e AC-06/07; matriz de suporte ainda pendente. |

A stack observada no projeto já inclui React, TypeScript, Vite, Tailwind,
Vitest e Playwright. Isso justifica reutilizá-la, não valida a especificação nem
aprova fornecedor de dados. Não se propõe Redux, backend ou biblioteca de cache,
pois não há necessidade confirmada que justifique essa complexidade.

## 3. Project Structure

Estrutura proposta, compatível com a organização existente e sem exigir
refatoração estrutural:

```text
src/
  app/                 # composição da aplicação, se separar de App.tsx for útil
  components/          # busca, resultados, clima, previsão, unidade e estados
  hooks/               # coordenação do estado e operações da tela
  services/            # cliente/adaptadores de geocoding e previsão
  types/               # City, CurrentWeather, ForecastDay e contratos de estado
  lib/                 # conversão/formatadores puros, após regras aprovadas
  styles/              # estilos globais e responsivos
tests/
  unit/                # serviços, normalização e funções puras
  components/          # interação e estados acessíveis
  e2e/                 # jornadas Playwright
```

Os nomes são uma divisão de responsabilidades, não uma exigência de criar todas
as pastas. Manter a estrutura compacta enquanto o escopo for uma única tela.
Separar `services` dos componentes dá suporte à substituição de fornecedor
(NFR-07; R-01, R-07); concentrar tipos reduz divergência entre clima atual,
previsão e unidade (FR-06; R-05).

## 4. Data Model

Os contratos abaixo são **rascunhos internos** para orientar a fronteira entre
serviço e UI. As propriedades ilustrativas de clima, período e contexto da cidade
não constituem lista aprovada: AC-02.2, AC-03.2 e AC-01.3 remetem explicitamente
às perguntas em aberto. Antes de fixar o schema, validar campos exibidos,
identificadores de cidade e resposta do fornecedor escolhido.

```ts
type TemperatureUnit = "celsius" | "fahrenheit";

interface City {
  id: string;                 // identificador estável no contexto do fornecedor
  name: string;
  latitude: number;
  longitude: number;
  region?: string;            // contexto proposto; aprovar quais campos mostrar
  country?: string;
  timezone?: string;          // guardar somente se adotado o fuso da cidade
}

interface CurrentWeather {
  city: City;
  observedAt?: string;        // ISO 8601; apresentação/fuso ainda pendentes
  temperature?: number;       // exemplo de campo; obrigatoriedade pendente
  conditionCode?: string;     // exemplo de dado normalizado; campo pendente
  sourceUpdatedAt?: string;   // se fornecido e aprovado para comunicação
}

interface ForecastDay {
  date: string;               // data do dia no fuso definido após validação
  minTemperature?: number;    // campos exemplificativos, não requisitos
  maxTemperature?: number;
  conditionCode?: string;
}

interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];    // objetivo de cinco dias; referência temporal pendente
}

type WeatherQueryState =
  | { status: "idle" }
  | { status: "loading"; operation: "search" | "weather" }
  | { status: "success"; data: WeatherData }
  | { status: "empty"; operation: "search" }
  | { status: "error"; operation: "search" | "weather"; message: string; retryable: boolean };
```

`TemperatureUnit` representa as duas unidades do FR-05; unidade inicial,
persistência e arredondamento não são definidos aqui (AC-04.3, R-05). A conversão
deve operar sobre valores numéricos normalizados e ser centralizada, mas só deve
ser fechada quando a regra de arredondamento e as unidades suportadas pela fonte
forem aprovadas. Datas devem preservar os dados de origem; formato regional e
fuso para exibição continuam em aberto (NFR-05, R-04).

## 5. Data Flow

1. A pessoa informa um termo de busca. A UI valida apenas o mínimo necessário
   para evitar requisições vazias; regras de busca parcial/sugestões dependem da
   decisão sobre FR-01 e das perguntas em aberto.
2. A tela passa para `loading/search` e o serviço consulta geocoding. Resultado
   vazio vira `empty/search`; erro de rede/serviço vira `error/search`, nunca
   “nenhuma cidade encontrada” (FR-07; AC-06.1–AC-06.3, propostas para validação).
3. O serviço normaliza os resultados para `City`; a UI os apresenta com contexto
   geográfico disponível para reduzir homônimos. Os campos exatos devem ser
   aprovados (FR-09, AC-01.1/01.3, R-02).
4. Ao selecionar uma cidade, a UI guarda a seleção e inicia a consulta de clima
   para suas coordenadas. O serviço converte a resposta externa ao contrato
   interno `WeatherData` e a tela exibe dados ligados à cidade escolhida
   (FR-02–FR-04, AC-01.2, AC-02.1, AC-03.1).
5. A alternância Celsius/Fahrenheit atualiza a apresentação de todas as
   temperaturas sem nova busca, se os dados internos e a fonte permitirem.
   Mostrar símbolo/identificação junto aos valores. A implementação final da
   conversão depende de AC-04.3 (FR-05/06, AC-02.3, AC-03.3, AC-04.1/04.2).
6. Retry repete a operação que falhou usando a busca/cidade selecionada e
   retorna ao estado de carregamento. Evitar que uma resposta antiga sobrescreva
   a busca mais recente; não definir política de retentativa automática ou cache
   sem aprovação (FR-08, AC-07.1/07.2; R-01).

## 6. External APIs

### Proposta provisória: Open-Meteo

O prompt de planejamento solicita descrever Open-Meteo, e a stack do projeto
permite uma integração HTTP direta. Portanto, os endpoints abaixo são uma
**hipótese técnica provisória para avaliação**, não uma fonte aprovada pela
especificação. A fonte e seus termos, cobertura, limites, custos, disponibilidade,
atribuição e implicações de privacidade precisam ser avaliados/aprovados antes da
adoção (NFR-07, NFR-06; perguntas abertas 8 e 16; R-01, R-02, R-07).

1. **Geocoding (sugestão):**
   `GET https://geocoding-api.open-meteo.com/v1/search`
   - Parâmetros propostos: `name=<termo>`; `count=<limite>`; `language=<idioma>`
     e `format=json` quando adequados.
   - A resposta deve ser mapeada para `City`. Quantidade de resultados, idioma e
     campos de identificação dependem da validação de busca, cobertura e contexto
     para homônimos (FR-01/09, AC-01.1/01.3, R-02).
2. **Forecast (sugestão):**
   `GET https://api.open-meteo.com/v1/forecast`
   - Parâmetros-base propostos: `latitude=<lat>` e `longitude=<lon>`.
   - A API permite parâmetros para campos `current` e `daily`, unidade de
     temperatura, fuso e horizonte de previsão. Os valores de `current`/`daily`,
     `forecast_days`, `temperature_unit` e `timezone` **não devem ser fixados
     neste plano**: dependem das decisões sobre
     campos, período incluindo ou não hoje, unidade inicial/estratégia de
     conversão e fuso (AC-02.2, AC-03.2, AC-04.3, NFR-05; perguntas abertas 4–7
     e 14; R-03–R-05).
   - Solicitar apenas os campos necessários depois de aprovados, verificar
     resposta e erros HTTP, e normalizar no adaptador. O período desejado de cinco
     dias é requisito de alto nível; como a API representa dias-calendário e
     horizonte, confirmar o mapeamento antes de declarar cobertura exata de
     cinco dias.

Não há chave ou credencial a incluir no cliente. Antes de chamadas diretas do
navegador, verificar termos da fonte, políticas de uso e CORS; não enviar dados
pessoais nem registrar termos de busca identificáveis sem justificativa/aprovação
(NFR-06/07, R-07). Se os termos ou limites exigirem mediação, um backend/BFF é
alternativa a avaliar, não parte confirmada do escopo.

## 7. State Management

Usar estado React local na tela, encapsulado em `useWeather` (ou mantido em
`App` se a tela continuar pequena). Estado mínimo proposto:

- `query`: texto atual da busca;
- `searchResults: City[]` e `selectedCity: City | null`;
- `weather: WeatherData | null`;
- `unit: TemperatureUnit`;
- estados independentes de busca e consulta, discriminados por status para
  diferenciar `loading`, `empty` e `error`;
- erro tipado por operação e indicação se retry é aplicável.

Não usar store externo nem persistência neste estágio. A unidade deve atualizar
toda a visualização de temperatura, mas valor inicial e retenção ao trocar de
cidade/recarregar são pendências (AC-04.1–AC-04.3). Cache ou exibição de dado
anterior como desatualizado só deve ser introduzido após decidir a política de
atualidade/offline (NFR-04; perguntas 12–13; R-04). Separar estados de busca e
clima evita que um resultado vazio de geocoding seja confundido com falha de
forecast (AC-06.2/06.3).

## 8. Error Handling Strategy

| Situação | Tratamento proposto | Rastreabilidade |
|---|---|---|
| Inicial/sem cidade | Estado neutro, sem dados meteorológicos fictícios; oferecer busca. | FR-01/02. |
| Carregando busca ou clima | Indicação visível e semanticamente anunciada; impedir duplicação acidental da mesma ação quando necessário. | FR-07; AC-06.1 (proposta a validar), NFR-03. |
| Busca concluída sem resultados | Mensagem explícita de nenhuma cidade encontrada; manter possibilidade de corrigir a busca. | FR-07; AC-06.2 (proposta a validar). |
| Serviço/rede falha | Mensagem de falha distinta de vazio; preservar contexto suficiente para nova tentativa e não apresentar dado incompleto como sucesso. | FR-07/08; AC-06.3/07.1/07.2 (propostas a validar). |
| Resposta inválida, cidade sem cobertura ou campo ausente | Adaptador valida o mínimo esperado e retorna erro controlado; não inventa valores. O limite do que é dado válido depende dos campos aprovados. | FR-02–04, NFR-04/07; R-01–03. |
| Retry | Ação explícita reapresenta loading e depois resultado ou falha. Evitar retry infinito/automático; repetir apenas falha recuperável identificada. | FR-08; AC-07.1/07.2 (propostas a validar). |
| Resposta defasada / offline | Exibir falha/indisponibilidade de forma clara. Cache e eventual exibição de dado antigo só após definição de validade, horário e rotulagem. | NFR-04; perguntas 12–14; R-01/R-04. |

Erros técnicos detalhados ficam em logs sem dados pessoais desnecessários; a
interface apresenta mensagem compreensível e não revela detalhes internos.
Proteção de transporte, minimização de dados e eventual política de logs dependem
dos serviços aprovados (NFR-06). Feedback imediato é proposto, mas nenhuma meta de
latência, timeout ou política de backoff fica estabelecida sem resposta à
pergunta aberta 11 (NFR-03).

## 9. Testing Strategy

### Unitários e componentes — Vitest

- Testar adaptadores com respostas simuladas: mapeamento de resultados de cidade,
  validação de respostas e conversão de erros HTTP/rede.
- Testar transições `idle → loading → success/empty/error`, distinção entre
  vazio e falha e retry; cobrir falha de busca e de previsão isoladamente
  (FR-07/08; AC-06/07, propostas a validar).
- Testar apresentação consistente da unidade para valores atuais e previstos e
  identificação visível da unidade. Os testes numéricos de conversão/arredondamento
  só podem fixar expectativas após AC-04.3 ser aprovado (FR-05/06; R-05).
- Testar contexto de cidades homônimas com fixture que reflita os campos
  identificadores aprovados, e correspondência da cidade selecionada com os dados
  renderizados (FR-02/09; AC-01.2/01.3; R-02).
- Verificar acessibilidade básica dos controles: nomes/labels, foco e operação
  por teclado, estados anunciados sem depender apenas de cor (NFR-02).
- Manter testes determinísticos com `fetch` mockado; não depender da rede pública.

### E2E — Playwright

- Fluxo de busca com resultados, seleção e exibição dos dados correspondentes;
- busca sem resultados e falha simulada, com mensagens diferentes;
- alternância de unidade e consistência nos valores atuais/forecast;
- retry após erro recuperável;
- navegação por teclado e ausência de rolagem horizontal nos viewports definidos.

Esses cenários verificam AC-01.*, AC-02.1/02.3, AC-03.1/03.3, AC-04.1/04.2,
AC-05.1/05.2 e AC-06/07. E2E deve interceptar endpoints para não depender de
serviço externo. Viewports, browsers, critérios de acessibilidade e suporte
específico devem ser escolhidos depois de AC-05.3/NFR-01/02 e das perguntas
abertas 9–10; metas quantitativas de tempo e cobertura também não são presumidas
(NFR-03).

## 10. Risks & Trade-offs

| Risco da spec | Decisão/mitigação técnica proposta | Trade-off e pendência |
|---|---|---|
| **R-01 — Fonte indisponível, lenta ou limitada** | Isolar chamadas no serviço; estados distintos e retry manual; testar falhas sem rede real. | Não há cache ou backoff definido. Aprovar disponibilidade, limites, custos e atualização (NFR-03/04/07). |
| **R-02 — Homônimos, grafias e cobertura** | Modelo `City` permite contexto geográfico e coordenadas; seleção explícita pelo usuário. | Campos e semântica de busca dependem de validação; geocoding Open-Meteo é apenas proposta (FR-01/09, AC-01.3). |
| **R-03 — Campos e período ambíguos** | Manter contratos de clima como rascunho e adaptador isolado; não fixar campos finais de API/UI. | Bloqueia a definição completa dos tipos, telas e asserts de testes (AC-02.2/03.2; perguntas 4–6). |
| **R-04 — Defasagem, fuso ou data incorreta** | Preservar timestamps e dados de fuso de origem quando disponíveis; definir apresentação só após decisão. | Sem cache, validade ou fuso aprovados, não prometer uso offline nem “dia local” (NFR-04/05; pergunta 14). |
| **R-05 — Conversão/arredondamento inconsistente** | Um único ponto de formatação/conversão; testes compartilhados para clima atual e forecast. | Confirmar unidade inicial, conversão vs. consulta à fonte, arredondamento e persistência (AC-04.3; perguntas 7 e 5). |
| **R-06 — Mobile, toque e acessibilidade** | Layout responsivo, interação por teclado e estados semânticos; validar em E2E. | Critérios e matriz de dispositivos/tecnologias assistivas precisam ser aprovados (NFR-01/02; AC-05.3; perguntas 9–10). |
| **R-07 — Licença, atribuição e privacidade** | Não acoplar produto a fonte sem revisão; minimizar dados e não colocar credenciais no cliente. | Open-Meteo é hipótese técnica; termos, atribuição, coleta e backend permanecem sujeitos à aprovação (NFR-06/07; pergunta 8/16). |
| **R-08 — Expansão implícita de escopo** | Limitar proposta a busca por cidade, clima, forecast, unidade e estados básicos. | Geolocalização, favoritos, histórico, alertas, contas, offline e métricas ficam fora salvo decisão explícita; confirmar também itens de Out of Scope. |

### Decisões a validar antes de fechar a implementação

1. Campos obrigatórios de clima atual e de cada dia, e se os cinco dias incluem
   hoje (AC-02.2, AC-03.2; perguntas 4–6).
2. Unidade inicial, preferência ao trocar de cidade/recarregar, origem da
   conversão e arredondamento (AC-04.3; pergunta 7).
3. Fuso, formatos de data/idioma, política de atualização, defasagem e eventual
   cache (NFR-04/05; perguntas 2, 12–14).
4. Aprovação de fonte e termos, limites, cobertura, custos, atribuição, tratamento
   de dados e eventual necessidade de backend (NFR-06/07; perguntas 8 e 16;
   R-01/R-07).
5. Matriz de plataforma, dispositivos, navegadores, acessibilidade e metas de
   resposta/volume (NFR-01–03; perguntas 9–11).
6. Confirmar quais necessidades inferidas (FR-06–FR-09 e US/AC-06/07) passam a
   fazer parte do escopo aprovado.

Até essas validações, Open-Meteo, contratos de campos climáticos, período
detalhado, unidades iniciais/persistidas/arredondadas, fuso, metas, plataforma e
fornecedor devem ser tratados como hipóteses ou pontos em aberto — não como
decisões confirmadas.
