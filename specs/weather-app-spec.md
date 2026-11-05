# Especificação — Aplicação de previsão do tempo

> **Status:** proposta para validação. Os requisitos confirmados pelo briefing
> estão separados das necessidades inferidas; perguntas em aberto precisam ser
> respondidas antes de considerar o escopo final aprovado.

## Overview

A aplicação permitirá consultar o clima atual e a previsão de cinco dias de uma
cidade, alternando a unidade de temperatura entre Celsius e Fahrenheit. A
experiência deverá ser utilizável em dispositivos móveis.

O objetivo é permitir que uma pessoa encontre a cidade desejada e compreenda
suas condições meteorológicas atuais e previstas. O briefing não define quais
dados compõem essas condições, se a previsão inclui o dia atual, nem a fonte de
dados; essas decisões permanecem em aberto.

## Functional Requirements

### Confirmados pelo briefing

- **FR-01 — Buscar cidades:** permitir que a pessoa pesquise cidades.
- **FR-02 — Selecionar cidade:** permitir consultar o clima de uma cidade
  selecionada nos resultados da busca.
- **FR-03 — Exibir clima atual:** apresentar o clima atual da cidade selecionada.
- **FR-04 — Exibir previsão:** apresentar a previsão de cinco dias da cidade
  selecionada.
- **FR-05 — Alternar unidade:** permitir alternar entre Celsius e Fahrenheit.
- **FR-06 — Aplicar unidade consistentemente:** exibir as temperaturas do clima
  atual e da previsão na unidade selecionada. Necessidade inferida no discovery,
  proposta para validação.

### Necessidades inferidas, propostas para validação

- **FR-07 — Informar estados da consulta:** comunicar quando uma busca ou
  consulta está em andamento, não retorna resultados ou falha.
- **FR-08 — Tentar novamente:** oferecer uma nova tentativa após uma falha
  recuperável.
- **FR-09 — Identificar a cidade:** fornecer contexto suficiente nos resultados
  para ajudar a distinguir cidades homônimas. Os dados identificadores ainda
  precisam ser definidos.

## User Stories

- **US-01:** Como pessoa que consulta o tempo, quero buscar uma cidade para
  encontrar o local cujas condições desejo verificar.
- **US-02:** Como pessoa que consulta o tempo, quero ver o clima atual da cidade
  selecionada para entender as condições presentes.
- **US-03:** Como pessoa que consulta o tempo, quero ver a previsão de cinco dias
  da cidade selecionada para me orientar sobre os próximos dias.
- **US-04:** Como pessoa que consulta o tempo, quero alternar entre Celsius e
  Fahrenheit para ler as temperaturas na unidade que prefiro.
- **US-05:** Como pessoa usando um dispositivo móvel, quero consultar o clima em
  uma interface utilizável em uma tela pequena para concluir a consulta no meu
  dispositivo.
- **US-06:** Como pessoa que consulta o tempo, quero saber quando a consulta está
  carregando, falha ou não encontra resultados para entender o que aconteceu.
- **US-07:** Como pessoa cuja consulta falhou por uma condição recuperável, quero
  tentar novamente para obter os dados sem reiniciar o fluxo.

## Acceptance Criteria

### US-01 — Busca e seleção de cidade

- **AC-01.1:** Dada uma busca por cidade com resultados, quando os resultados
  forem apresentados, então a pessoa consegue selecionar um deles.
- **AC-01.2:** Quando uma cidade for selecionada, então as informações
  meteorológicas apresentadas correspondem à cidade selecionada.
- **AC-01.3:** Se houver resultados que possam ser confundidos por terem o mesmo
  nome, então a interface apresenta contexto que ajude a distingui-los. Os
  campos de contexto (por exemplo, região ou país) dependem de validação.

### US-02 — Clima atual

- **AC-02.1:** Dada uma cidade selecionada e uma consulta concluída com dados,
  então a interface apresenta o clima atual dessa cidade.
- **AC-02.2:** As informações e os campos que compõem “clima atual” serão os
  aprovados nas perguntas em aberto antes da aprovação final desta
  especificação.
- **AC-02.3:** A temperatura atual, quando exibida, usa a unidade selecionada e
  identifica essa unidade sem depender apenas de cor.

### US-03 — Previsão de cinco dias

- **AC-03.1:** Dada uma cidade selecionada e uma consulta concluída com dados,
  então a interface apresenta a previsão para cinco dias conforme a definição
  aprovada para o período.
- **AC-03.2:** O período da previsão e os campos apresentados por dia serão os
  aprovados nas perguntas em aberto antes da aprovação final desta
  especificação.
- **AC-03.3:** Todas as temperaturas apresentadas na previsão usam a unidade
  selecionada e identificam essa unidade sem depender apenas de cor.

### US-04 — Unidade de temperatura

- **AC-04.1:** Quando a pessoa seleciona Celsius ou Fahrenheit, então as
  temperaturas exibidas no clima atual e na previsão passam a usar a unidade
  selecionada.
- **AC-04.2:** A unidade selecionada permanece identificável junto às
  temperaturas.
- **AC-04.3:** A unidade inicial, a regra de arredondamento e a persistência da
  preferência serão definidas antes da aprovação final.

### US-05 — Uso em dispositivos móveis

- **AC-05.1:** Nos dispositivos e tamanhos de tela acordados, os fluxos de busca,
  seleção, consulta e troca de unidade podem ser usados.
- **AC-05.2:** Nos tamanhos de tela acordados, o conteúdo não exige rolagem
  horizontal para concluir esses fluxos.
- **AC-05.3:** Dispositivos, navegadores, tamanhos de tela e critérios de
  validação específicos permanecem pendentes de definição.

### US-06 — Estados da consulta (proposta a validar)

- **AC-06.1:** Enquanto uma busca ou consulta estiver em andamento, a interface
  comunica que está carregando.
- **AC-06.2:** Quando a busca terminar sem resultados, a interface comunica que
  nenhuma cidade foi encontrada.
- **AC-06.3:** Quando uma busca ou consulta falhar, a interface informa que não
  foi possível concluí-la, sem apresentar a falha como uma resposta bem-sucedida
  ou como ausência de resultados.

### US-07 — Nova tentativa (proposta a validar)

- **AC-07.1:** Após uma falha recuperável, a pessoa consegue iniciar uma nova
  tentativa.
- **AC-07.2:** A nova tentativa comunica novamente o estado de carregamento e,
  ao terminar, apresenta o resultado ou a falha correspondente.

## Non-Functional Requirements

- **NFR-01 — Responsividade:** oferecer experiência utilizável em dispositivos
  móveis. A matriz de dispositivos, navegadores e tamanhos de tela será acordada.
- **NFR-02 — Acessibilidade:** apoiar navegação por teclado, rótulos semânticos,
  contraste adequado e comunicação que não dependa apenas de cor. O nível de
  conformidade e as tecnologias assistivas a testar ainda precisam ser definidos.
- **NFR-03 — Tempo de resposta:** fornecer feedback durante a espera. Metas de
  latência, condições de rede e volume de acessos esperado estão pendentes.
- **NFR-04 — Atualidade dos dados:** comunicar indisponibilidade e eventual
  desatualização quando aplicável. Frequência de atualização, tolerância à
  defasagem e política para dados armazenados estão pendentes.
- **NFR-05 — Clareza e consistência:** apresentar datas, unidades e temperaturas
  de forma clara e consistente. Idioma, formatos regionais, fuso e
  arredondamento precisam ser definidos.
- **NFR-06 — Privacidade e comunicação:** proteger as comunicações e minimizar
  a coleta de dados pessoais. Logs, retenção e consentimento dependem dos dados
  e serviços que vierem a ser aprovados.
- **NFR-07 — Fonte de dados:** selecionar uma fonte cuja cobertura e condições
  de uso sejam compatíveis com o produto, incluindo disponibilidade, limites,
  custos, licença e atribuição.

## Edge Cases

- A busca não retorna cidades.
- A busca retorna várias cidades com nomes iguais ou semelhantes.
- A cidade desejada não está coberta pela fonte de dados ou não é encontrada
  pela grafia informada.
- A entrada de busca está vazia ou não pode ser processada; o comportamento
  específico precisa ser definido junto com as regras de busca.
- A consulta falha, excede o tempo de espera ou a fonte de dados fica
  indisponível.
- A conexão é perdida durante a busca ou consulta.
- A consulta retorna dados incompletos ou sem uma das temperaturas esperadas.
- Os dados disponíveis estão desatualizados; a exibição e identificação desses
  dados dependem da política de atualização ainda pendente.
- A mudança de unidade ocorre enquanto uma consulta está em andamento ou após
  os dados já terem sido apresentados.
- A data da previsão pode ser interpretada de forma diferente conforme o fuso
  da cidade e o fuso do dispositivo; o fuso de referência precisa ser decidido.
- O layout é acessado em uma tela pequena, orientação ou navegador ainda não
  contemplado na matriz de suporte.

## Assumptions

- A primeira versão é uma aplicação para consulta por cidade; não se presume
  localização automática.
- A previsão solicitada cobre um período de cinco dias, mas a inclusão do dia
  atual ainda não foi determinada.
- Celsius e Fahrenheit são as duas unidades de temperatura disponíveis no
  escopo confirmado.
- Estados de carregamento, erro e busca sem resultados são propostas inferidas
  para tornar o resultado da consulta compreensível; sua aprovação deve ser
  confirmada.
- As decisões não respondidas neste documento não são consideradas requisitos
  aprovados e não devem ser resolvidas por suposição durante a implementação.

## Risks

| ID | Risco | Impacto | Mitigação proposta |
| --- | --- | --- | --- |
| R-01 | Indisponibilidade, lentidão ou limites da fonte meteorológica. | Consultas lentas ou sem resultado. | Validar disponibilidade, limites e custos; definir tratamento de falhas e atualização. |
| R-02 | Cidades homônimas, grafias alternativas ou cobertura insuficiente. | Seleção de cidade incorreta ou impossibilidade de encontrá-la. | Validar cobertura e definir como identificar resultados por contexto geográfico. |
| R-03 | Ambiguidade sobre clima atual e período/campos da previsão. | Entrega divergente da expectativa do negócio. | Aprovar os campos e a referência temporal antes de fechar os critérios. |
| R-04 | Dados defasados, fusos ou datas interpretados incorretamente. | Condições associadas ao horário ou dia errado. | Definir fuso, tolerância à defasagem e como informar atualização. |
| R-05 | Conversão ou arredondamento inconsistente entre unidades. | Temperaturas divergentes ou incorretas. | Definir uma regra de conversão e arredondamento e validá-la para todas as temperaturas. |
| R-06 | Interface inadequada a telas pequenas, toque ou tecnologias assistivas. | Parte do público não consegue concluir a consulta. | Acordar a matriz de suporte e validar os fluxos com critérios de acessibilidade. |
| R-07 | Licença, atribuição ou tratamento de dados pessoais não avaliados. | Restrições de publicação, custos ou exposição indevida de dados. | Revisar os termos da fonte e mapear dados coletados antes de aprovar serviços. |
| R-08 | Inclusão implícita de recursos não solicitados. | Aumento de prazo e custo sem prioridade definida. | Manter os itens listados em Out of Scope fora da primeira versão, salvo aprovação explícita. |

## Out of Scope

Não fazem parte do escopo confirmado da primeira versão:

- Geolocalização automática.
- Favoritos ou histórico de cidades.
- Alertas meteorológicos.
- Contas de usuário.
- Uso offline.
- Aplicativo nativo; o briefing solicita uso em dispositivos móveis, mas não
  define que seja necessária uma aplicação nativa.
- Previsões horárias ou campos meteorológicos específicos ainda não aprovados.

Qualquer inclusão desses itens exige validação e atualização do escopo.

## Open Questions

### Escopo e experiência

1. Quem é o público-alvo e qual problema principal a consulta deve resolver?
2. Quais países, regiões e idiomas precisam ser atendidos?
3. A busca deve aceitar nome completo, busca parcial ou sugestões? Como serão
   distinguidas cidades homônimas?
4. Quais informações são obrigatórias no clima atual (por exemplo, temperatura,
   condição, sensação térmica, umidade ou vento)?
5. Os cinco dias incluem hoje ou são os cinco dias seguintes? A previsão será
   diária ou também por horário?
6. Quais informações devem aparecer por dia, como mínimas e máximas, condição ou
   probabilidade de chuva?
7. Qual unidade será inicial? A preferência persiste ao trocar de cidade ou
   voltar à aplicação? Qual regra de arredondamento será usada?
8. Qual fonte de dados será aprovada? Há orçamento, requisitos de cobertura ou
   condições contratuais?

### Qualidade e operação

9. Quais dispositivos, navegadores, orientações e tamanhos de tela serão
   suportados? Uma aplicação web atende ou é exigido aplicativo nativo?
10. Qual nível de acessibilidade será exigido e quais tecnologias assistivas
    serão testadas?
11. Qual tempo de resposta é aceitável, em quais condições de rede e para qual
    volume de usuários simultâneos?
12. Com que frequência os dados devem ser atualizados? Qual defasagem é
    aceitável e como será informada?
13. O que deve ocorrer sem conexão ou durante indisponibilidade da fonte? Dados
    anteriores podem continuar visíveis se forem identificados como
    desatualizados?
14. Qual fuso deve orientar datas e horários: o da cidade consultada ou o do
    dispositivo?
15. Há necessidade de geolocalização, favoritos, histórico, alertas, contas ou
    uso offline? Algum desses recursos é essencial à primeira versão?
16. Haverá métricas de uso ou coleta de dados pessoais? Quais políticas de
    privacidade, consentimento e retenção se aplicam?
17. Qual é o prazo, quem aprova o escopo e como será avaliado o sucesso da
    primeira versão?
