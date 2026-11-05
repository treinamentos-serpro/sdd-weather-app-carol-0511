# Discovery — Aplicação de previsão do tempo

## Contexto e objetivo

A empresa solicitou uma aplicação para consultar o clima atual e a previsão
de cinco dias por cidade, alternar entre Celsius e Fahrenheit e usar em
dispositivos móveis.

Este documento analisa o briefing na fase de Thinking / Discovery. Não define
arquitetura, implementação ou critérios de aceite finais. Necessidades inferidas
e propostas dependem de validação com as partes interessadas.

## Requisitos funcionais

### Confirmados pelo briefing

| ID | Requisito | Pontos a esclarecer |
| --- | --- | --- |
| RF-01 | Permitir buscar cidades. | Cobertura geográfica, critérios de busca e seleção entre cidades homônimas. |
| RF-02 | Exibir o clima atual da cidade selecionada. | Quais informações compõem o clima atual e qual a atualização esperada. |
| RF-03 | Exibir a previsão de cinco dias da cidade selecionada. | Inclusão do dia atual e informações exibidas por dia. |
| RF-04 | Permitir alternar a exibição de temperaturas entre Celsius e Fahrenheit. | Unidade inicial, arredondamento e persistência da preferência. |

O uso em dispositivos móveis está registrado em RNF-01 por se tratar de uma
característica de usabilidade e compatibilidade.

### Necessidades inferidas, a validar

| ID | Necessidade | Justificativa |
| --- | --- | --- |
| RF-05 | Informar carregamento, busca sem resultados e falhas de consulta. | Evitar que ausência de dados seja confundida com ausência de resposta da aplicação. |
| RF-06 | Permitir nova tentativa após uma falha recuperável. | Viabilizar a consulta após indisponibilidade temporária ou perda de conexão. |
| RF-07 | Aplicar a unidade selecionada de forma consistente ao clima atual e à previsão. | Evitar temperaturas apresentadas em escalas diferentes sem indicação clara. |

## Requisitos não-funcionais

Somente RNF-01 é explícito no briefing. Os demais são propostas para validação;
metas quantitativas e abrangência serão definidas na especificação.

| ID | Requisito | Definição pendente |
| --- | --- | --- |
| RNF-01 | Oferecer uma experiência utilizável em dispositivos móveis. | Tamanhos de tela, sistemas e navegadores suportados; validação por toque e sem rolagem horizontal nas telas acordadas. |
| RNF-02 | Ser acessível, com navegação por teclado, rótulos semânticos, contraste e informações não dependentes apenas de cor. | Nível de conformidade e tecnologias assistivas a testar. |
| RNF-03 | Responder às buscas e consultas em tempo adequado, com feedback durante a espera. | Limites de latência, condições de rede e volume de acessos esperados. |
| RNF-04 | Comunicar indisponibilidade e eventual desatualização dos dados. | Frequência de atualização, tolerância à defasagem e política para dados armazenados. |
| RNF-05 | Apresentar datas, unidades e temperaturas de maneira clara e consistente. | Idioma, formatos regionais, fuso da cidade e regras de arredondamento. |
| RNF-06 | Proteger comunicações e minimizar a coleta de dados pessoais. | Política de logs, retenção e consentimento, caso localização ou outros dados pessoais sejam utilizados. |
| RNF-07 | Usar uma fonte de dados com cobertura e condições de uso compatíveis com o produto. | Disponibilidade, limites de consulta, custos, licença e atribuição exigida. |

## Riscos

As medidas abaixo são propostas de investigação ou mitigação, não decisões tomadas.

| ID | Risco | Impacto potencial | Investigação ou mitigação proposta |
| --- | --- | --- | --- |
| R-01 | Indisponibilidade, lentidão ou limites da fonte meteorológica. | Consultas falham ou ficam lentas, especialmente em picos de acesso. | Validar limites, custos e disponibilidade; definir tratamento de falhas e política de atualização. |
| R-02 | Cidades homônimas, grafias alternativas ou cobertura geográfica insuficiente. | O usuário escolhe a cidade errada ou não encontra a desejada. | Validar cobertura e identificar resultados por cidade, região e país. |
| R-03 | Ambiguidade em “clima atual” e “previsão de cinco dias”. | Produto entregue diverge da expectativa do negócio. | Acordar campos, referência temporal e inclusão ou não do dia atual. |
| R-04 | Dados defasados, fusos ou datas interpretados incorretamente. | Condições atuais e previsão aparecem associadas ao horário ou dia errado. | Validar referência de horário e definir como informar atualização e defasagem. |
| R-05 | Conversão ou arredondamento inconsistente entre unidades. | Temperaturas exibidas incorretamente ou divergentes entre telas. | Definir regra única e verificar conversão em todas as temperaturas exibidas. |
| R-06 | Interface inadequada a telas pequenas, toque ou tecnologias assistivas. | Parte do público não consegue concluir a consulta. | Validar fluxos nos dispositivos acordados e incluir verificações de acessibilidade. |
| R-07 | Exigências de licença, atribuição ou tratamento de dados pessoais não avaliadas. | Restrições de publicação, custos ou exposição indevida de dados. | Revisar termos do fornecedor e mapear dados coletados antes de aprovar serviços adicionais. |
| R-08 | Inclusão implícita de recursos não solicitados. | Aumento de prazo e custo sem prioridade de negócio definida. | Tratar geolocalização, favoritos, histórico, alertas, contas e uso offline como fora do escopo confirmado. |

## Perguntas em aberto

### Prioritárias para fechar o escopo

1. Quem é o público-alvo e qual problema principal a consulta deve resolver?
2. Quais países, regiões e idiomas precisam ser atendidos?
3. Como a busca deve funcionar: envio do nome completo, busca parcial ou sugestões? Como distinguir cidades homônimas?
4. Quais dados são obrigatórios no clima atual: temperatura, condição, sensação térmica, umidade, vento ou outros?
5. Os cinco dias incluem hoje ou representam os cinco dias seguintes? A previsão será diária ou também por horário?
6. Quais informações devem aparecer por dia: mínimas e máximas, condição, probabilidade de chuva ou outras?
7. Qual unidade deve ser usada inicialmente? A escolha deve ser mantida ao trocar de cidade ou voltar à aplicação? Qual regra de arredondamento usar?
8. Qual fonte de dados será aprovada? Há orçamento, restrições de cobertura ou condições contratuais?

### Qualidade e operação

9. Quais dispositivos, navegadores, orientações e tamanhos de tela devem ser suportados? Há exigência de aplicativo nativo ou uma aplicação web atende?
10. Qual nível de acessibilidade será exigido?
11. Qual tempo de resposta é aceitável, em quais condições de rede e para qual volume de usuários simultâneos?
12. Com que frequência os dados devem ser atualizados? Qual defasagem é aceitável e como informá-la ao usuário?
13. O que deve ocorrer quando não houver conexão ou a fonte estiver indisponível? Dados anteriores podem continuar visíveis, identificados como desatualizados?
14. Qual fuso deve orientar datas e horários: o da cidade consultada ou o do dispositivo?
15. Há necessidade de geolocalização, favoritos, histórico, alertas, contas ou uso offline? Algum desses recursos é essencial à primeira versão?
16. Haverá métricas de uso ou coleta de dados pessoais? Quais políticas de privacidade, consentimento e retenção se aplicam?
17. Qual é o prazo, quem aprova o escopo e como será avaliado o sucesso da primeira versão?

## Encaminhamento para a fase de Spec

Validar as perguntas prioritárias com o negócio, registrar as decisões e transformar
os requisitos aprovados em uma especificação com critérios de aceite verificáveis.
Requisitos inferidos e metas de qualidade só devem ser assumidos como compromisso
após validação. Nenhuma implementação faz parte desta etapa.