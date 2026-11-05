# Backlog de Tarefas — Aplicação de previsão do tempo

> Derivado de [plans/weather-app-plan.md](../plans/weather-app-plan.md) e
> [specs/weather-app-spec.md](../specs/weather-app-spec.md). A especificação e o
> plano ainda estão propostos para validação. As tarefas T-01–T-05 formalizam
> decisões pendentes; não iniciar as tarefas que dependem delas antes de suas
> aprovações. Open-Meteo permanece uma hipótese, não uma escolha assumida.
>
> Os caminhos em “Arquivos prováveis” são sugestões de localização e podem ser
> ajustados à estrutura já existente, sem refatoração desnecessária.

## Tarefas

### T-01 — Definir os dados meteorológicos e o período da previsão

- **Descrição:** Aprovar os campos do clima atual e de cada dia da previsão, se
  os cinco dias incluem hoje, e as regras de data/fuso e idioma necessárias à
  apresentação.
- **Critérios de aceite verificáveis:**
  - Os campos obrigatórios do clima atual e da previsão estão registrados na
    especificação.
  - A referência dos cinco dias, o fuso e os formatos de data/idioma estão
    definidos ou explicitamente registrados como não aplicáveis.
  - AC-02.2 e AC-03.2 não dependem de decisões em aberto.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** Data

### T-02 — Definir busca e identificação das cidades

- **Descrição:** Aprovar o comportamento da busca e os campos de contexto
  necessários para selecionar e distinguir cidades nos resultados.
- **Critérios de aceite verificáveis:**
  - A especificação define os comportamentos de busca aceitos, incluindo como
    tratar entrada vazia e resultados sem correspondência.
  - Os campos de identificação/contexto dos resultados estão definidos e
    suficientes para o critério AC-01.3.
  - As decisões estão registradas na especificação ou no plano.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** Data

### T-03 — Aprovar fonte meteorológica e condições de uso

- **Descrição:** Avaliar e aprovar a fonte de dados e a forma de integração,
  verificando cobertura, limites, custos, licença, atribuição, privacidade e
  CORS; decidir se chamadas do navegador são aceitáveis ou se é necessário um
  backend/BFF.
- **Critérios de aceite verificáveis:**
  - A fonte aprovada e a arquitetura de acesso estão registradas no plano.
  - Os requisitos de atribuição, privacidade e limites aplicáveis estão
    documentados.
  - A decisão não exige credenciais secretas incluídas no cliente.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `plans/weather-app-plan.md`
- **Tipo:** Infra

### T-04 — Definir regras da unidade de temperatura

- **Descrição:** Aprovar a unidade inicial, a conversão (ou consulta à fonte),
  o arredondamento e se a preferência permanece ao trocar de cidade ou
  recarregar a aplicação.
- **Critérios de aceite verificáveis:**
  - AC-04.3 tem uma regra definida para unidade inicial, conversão e
    arredondamento.
  - A retenção da preferência está definida; se não houver persistência, isso
    fica explícito.
  - A regra aprovada está registrada na especificação ou no plano.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** Data

### T-05 — Definir matriz de suporte e validação de acessibilidade

- **Descrição:** Acordar os viewports, dispositivos e navegadores suportados,
  além dos critérios de acessibilidade e das tecnologias assistivas a validar.
- **Critérios de aceite verificáveis:**
  - AC-05.3 e NFR-01/02 especificam a matriz de suporte e os critérios de
    validação escolhidos.
  - Os viewports definidos podem ser usados como parâmetros dos testes
    responsivos/E2E.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`
- **Tipo:** UI

### T-06 — Criar contratos internos tipados

- **Descrição:** Definir os tipos de cidade, clima atual, previsão, unidade,
  dados meteorológicos e estados/erros da consulta com base nas decisões
  aprovadas e na fronteira do fornecedor selecionado.
- **Critérios de aceite verificáveis:**
  - Os tipos representam os campos aprovados em T-01/T-02 e não tratam campos
    ilustrativos do plano como obrigatórios sem aprovação.
  - A unidade e os estados distinguem busca vazia de falha de serviço.
  - O projeto passa a consumir esses contratos compartilhados, sem tipos
    duplicados para os mesmos dados.
- **Dependências:** T-01, T-02, T-03, T-04.
- **Arquivos prováveis:** `src/types/weather.ts`
- **Tipo:** Data

### T-07 — Implementar serviço de busca e normalização de cidades

- **Descrição:** Implementar a consulta de geocoding aprovada, validar a
  resposta externa e normalizar resultados para o contrato `City`.
- **Critérios de aceite verificáveis:**
  - O serviço usa os parâmetros e campos aprovados para a busca.
  - Resultados válidos são normalizados com os identificadores e contexto
    definidos em T-02.
  - Resposta vazia, resposta inválida, erro HTTP e falha de rede são
    diferenciáveis; o serviço não converte falha em lista vazia.
  - O serviço não depende de rede pública para ser testado.
- **Dependências:** T-02, T-03, T-06.
- **Arquivos prováveis:** `src/services/geocodingService.ts`
- **Tipo:** Data

### T-08 — Implementar serviço de clima atual e previsão

- **Descrição:** Implementar a consulta meteorológica para as coordenadas da
  cidade selecionada e normalizar a resposta para `WeatherData`.
- **Critérios de aceite verificáveis:**
  - A requisição solicita somente os campos e o período aprovados em T-01.
  - A resposta é validada e mapeada para os contratos internos, preservando
    datas/timestamps necessários conforme as decisões aprovadas.
  - Erros HTTP, rede e dados inválidos são retornados como falhas, sem produzir
    dados fictícios ou sucesso incompleto.
  - A consulta não depende de rede pública para ser testada.
- **Dependências:** T-01, T-03, T-04, T-06.
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data

### T-09 — Implementar conversão e formatação de temperaturas

- **Descrição:** Criar funções puras compartilhadas para exibir temperaturas
  atuais e previstas de acordo com as regras aprovadas.
- **Critérios de aceite verificáveis:**
  - A conversão e o arredondamento seguem T-04.
  - Os valores formatados identificam a unidade sem depender apenas de cor.
  - As funções tratam os valores permitidos pelos contratos e não inventam
    valores para dados ausentes.
- **Dependências:** T-01, T-04, T-06.
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Tipo:** Data

### T-10 — Coordenar busca, seleção e consulta no estado da tela

- **Descrição:** Implementar o hook/estado local que coordena termo de busca,
  resultados, cidade selecionada, dados meteorológicos e estados das operações.
- **Critérios de aceite verificáveis:**
  - Busca, seleção e consulta seguem os estados tipados definidos em T-06.
  - Vazio de busca é distinto de erro de busca e de erro meteorológico.
  - Uma resposta de consulta anterior não substitui o resultado da operação
    mais recente.
  - O estado conserva contexto suficiente para permitir retry manual de uma
    falha recuperável.
- **Dependências:** T-06, T-07, T-08.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data

### T-11 — Criar busca e seleção acessíveis de cidades

- **Descrição:** Implementar o formulário de busca e a lista de resultados com
  o contexto aprovado para diferenciar cidades.
- **Critérios de aceite verificáveis:**
  - A pessoa consegue submeter uma busca e selecionar um resultado por teclado.
  - Cada resultado apresenta os campos de contexto aprovados em T-02.
  - Controles e resultados têm nomes acessíveis e foco perceptível.
- **Dependências:** T-02, T-07, T-10.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`
- **Tipo:** UI

### T-12 — Exibir clima atual da cidade selecionada

- **Descrição:** Criar a apresentação do clima atual usando apenas os campos
  aprovados e associando os dados à cidade selecionada.
- **Critérios de aceite verificáveis:**
  - A interface apresenta os campos de clima atual aprovados em T-01.
  - A cidade apresentada corresponde à seleção corrente.
  - Temperaturas usam a função compartilhada de T-09 e identificam a unidade.
- **Dependências:** T-01, T-06, T-09, T-10.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Tipo:** UI

### T-13 — Exibir previsão aprovada de cinco dias

- **Descrição:** Criar a apresentação da previsão diária, respeitando o período,
  o fuso e os campos aprovados.
- **Critérios de aceite verificáveis:**
  - A previsão contém o número e os dias definidos em T-01.
  - Cada dia apresenta os campos aprovados, com datas interpretadas segundo o
    fuso decidido.
  - Temperaturas usam a função compartilhada de T-09 e identificam a unidade.
- **Dependências:** T-01, T-06, T-09, T-10.
- **Arquivos prováveis:** `src/components/Forecast.tsx`
- **Tipo:** UI

### T-14 — Adicionar controle de unidade de temperatura

- **Descrição:** Permitir alternar entre Celsius e Fahrenheit e atualizar todos
  os valores apresentados sem repetir a consulta quando os dados normalizados
  forem suficientes.
- **Critérios de aceite verificáveis:**
  - É possível selecionar as duas unidades por teclado e por interação usual.
  - Clima atual e previsão atualizam para a mesma unidade, identificada junto
    aos valores.
  - O comportamento inicial e de retenção segue a decisão de T-04.
- **Dependências:** T-04, T-09, T-10, T-12, T-13.
- **Arquivos prováveis:** `src/components/TemperatureUnitToggle.tsx`
- **Tipo:** UI

### T-15 — Apresentar estados vazios, carregamento, erro e retry

- **Descrição:** Implementar o feedback visual e semântico para operações em
  andamento, busca sem resultados e falhas recuperáveis, com retry explícito.
- **Critérios de aceite verificáveis:**
  - Busca vazia e falha de busca apresentam mensagens diferentes.
  - Falha meteorológica é comunicada sem apresentar os dados como sucesso.
  - Loading e mudanças de estado são comunicados semanticamente.
  - Retry disponível repete a operação correspondente e apresenta novo loading
    seguido do resultado ou da falha.
- **Dependências:** T-10, T-11, T-12, T-13.
- **Arquivos prováveis:** `src/components/QueryStatus.tsx`,
  `src/components/CitySearch.tsx`, `src/components/CurrentWeather.tsx`,
  `src/components/Forecast.tsx`
- **Tipo:** UI

### T-16 — Integrar layout responsivo e atribuição da fonte

- **Descrição:** Integrar os componentes em uma tela responsiva, cumprir a
  matriz de suporte e apresentar a atribuição da fonte quando exigida pelos
  termos aprovados.
- **Critérios de aceite verificáveis:**
  - Fluxos de busca, seleção, consulta e troca de unidade podem ser concluídos
    nos viewports acordados em T-05.
  - Nos viewports acordados, não há rolagem horizontal necessária para concluir
    esses fluxos.
  - Requisitos de atribuição definidos em T-03 são atendidos.
  - A composição mantém operação por teclado e estrutura semântica.
- **Dependências:** T-03, T-05, T-11, T-12, T-13, T-14, T-15.
- **Arquivos prováveis:** `src/App.tsx`, `src/styles/`,
  `src/components/WeatherDashboard.tsx`
- **Tipo:** UI

### T-17 — Testar serviços e adaptadores com respostas controladas

- **Descrição:** Criar testes unitários para normalização, validação e falhas
  dos serviços de geocoding e previsão.
- **Critérios de aceite verificáveis:**
  - Testes cobrem mapeamento de cidade e resposta meteorológica válidas.
  - Testes distinguem resposta sem resultados de resposta inválida, erro HTTP e
    falha de rede.
  - Os testes usam respostas simuladas e não acessam serviços externos.
- **Dependências:** T-06, T-07, T-08.
- **Arquivos prováveis:** `tests/unit/geocodingService.test.ts`,
  `tests/unit/weatherService.test.ts`
- **Tipo:** Test

### T-18 — Testar conversão de temperatura e estados do hook

- **Descrição:** Cobrir com testes determinísticos as regras de temperatura e
  as transições de estado da coordenação de busca/clima.
- **Critérios de aceite verificáveis:**
  - Conversão, arredondamento e unidade exibida têm asserts alinhados às regras
    aprovadas em T-04.
  - Testes cobrem estados iniciais, loading, sucesso, busca vazia, falha e retry.
  - Testes verificam que resposta antiga não sobrescreve operação mais recente.
- **Dependências:** T-09, T-10.
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`,
  `tests/unit/useWeather.test.ts`
- **Tipo:** Test

### T-19 — Testar interações e acessibilidade dos componentes

- **Descrição:** Criar testes de componentes para busca, seleção, unidade,
  estados da consulta e operação acessível.
- **Critérios de aceite verificáveis:**
  - Testes cobrem seleção de cidade e correspondência entre cidade e dados
    apresentados.
  - Testes cobrem estados de loading, vazio e erro, incluindo retry quando
    aplicável.
  - Controles podem ser localizados por semântica acessível e operados por
    teclado nos fluxos cobertos.
- **Dependências:** T-11, T-12, T-13, T-14, T-15.
- **Arquivos prováveis:** `tests/components/CitySearch.test.tsx`,
  `tests/components/WeatherDashboard.test.tsx`
- **Tipo:** Test

### T-20 — Validar jornadas principais com Playwright

- **Descrição:** Criar testes E2E determinísticos para as jornadas principais,
  interceptando as chamadas externas e usando a matriz aprovada.
- **Critérios de aceite verificáveis:**
  - O fluxo de busca, seleção e exibição dos dados correspondentes passa.
  - Testes distinguem busca sem resultados de falha e cobrem retry após erro
    recuperável.
  - Alternar unidade atualiza clima atual e previsão.
  - Fluxos definidos passam por teclado e não apresentam rolagem horizontal
    nos viewports de T-05.
  - Os testes não dependem da disponibilidade da fonte externa.
- **Dependências:** T-16.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test
