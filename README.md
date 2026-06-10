# Trabalho Individual - Gerência de Configuração e Evolução de Software (2026-1)

Os conhecimentos de Gerência de Configuração e Evolução de Software (GCES) são fundamentais no ciclo de vida de um produto de software moderno. Este trabalho tem como objetivo exercitar os conceitos de automação, isolamento de ambiente, testes, segurança (DevSecOps) e deploy contínuo.

A aplicação base é o **mk.js**, um jogo de luta implementado com Backend em Node.js/Express e Frontend em HTML5 Canvas/JavaScript. O projeto original é considerado *deprecated* e possui dependências antigas; parte do desafio é modernizar o ambiente para que ele execute com versões estáveis atuais.

## Requisitos do Projeto

O trabalho está dividido em 10 etapas, cada uma valendo **1,0 ponto**. O foco é a implementação técnica aliada à correta documentação e histórico de commits.

### Critérios de Avaliação (10 Fases)

| Fase | Descrição Técnica | Nota por etapa |
|---|---|---|
| 1. **Containerização (DEV)** | Elaboração de `Dockerfile` para ambiente de desenvolvimento com suporte a hot-reload (mudanças no código refletidas imediatamente no container). | 0-10% |
| 2. **Docker Compose (DEV)** | Configuração de um `docker-compose.yml` que integre a aplicação e um banco de dados **Postgres**. Você deve implementar uma camada simples de persistência no código (ex: salvar histórico de lutas ou nomes de jogadores). | 10% - 20% |
| 3. **CI - Build & Lint** | Automação das etapas de Build e Lint (Front e Back) via GitHub Actions. O pipeline deve falhar se o lint encontrar erros. | 20% - 30% |
| 4. **CI - Testes Unitários** | Implementação de testes unitários funcionais. **Obrigatório:** Commits sequenciais demonstrando o teste quebrando no CI e, em seguida, passando após correção. | 30% - 40% |
| 5. **CI - Testes de Fuzzing** | Implementação de testes de Fuzzing para validar a resiliência das entradas do servidor (Back-end) contra dados inesperados. | 40% - 50% |
| 6. **Segurança - SAST & SCA** | Integração de ferramentas de análise estática de segurança (SAST) e verificação de vulnerabilidades em dependências (SCA - ex: Snyk ou npm audit). | 50% - 60% |
| 7. **Qualidade de Código** | Integração completa com o **SonarCloud** no pipeline de CI, garantindo métricas de qualidade e cobertura mínima. | 60% - 70% |
| 8. **Containerização (PROD)** | Elaboração de `Dockerfiles` otimizados para produção (multi-stage build, baseados em Alpine) e configuração do **Nginx** como servidor de arquivos estáticos. | 70% - 80% | 
| 9. **Infraestrutura (K8s & Terraform)** | Criação de manifestos de **Kubernetes (K8s)** para orquestração da aplicação. Opcionalmente, utilize **Terraform** para provisionar a infraestrutura necessária. | 80% - 90% |
| 10. **CD & Segurança de Rede** | Deploy Contínuo com publicação de imagens e configuração de **HTTPS via Cert Manager**. O Nginx deve redirecionar porta 80 para 443 e não expor outras portas para fora da rede de containers. | 90% - 100% |

## Orientações Gerais

*   **Repositório:** O trabalho deve ser desenvolvido em um repositório pessoal no GitHub.
*   **Commits:** Devem ser atômicos e espaçados no tempo. Commits realizados todos juntos na data de entrega serão penalizados.
*   **Modernização:** É responsabilidade do aluno atualizar o `package.json` e as dependências do servidor para garantir compatibilidade com as versões mais recentes do Node.js.
*   **Documentação:** O `README.md` final deve conter o passo a passo de como subir o ambiente de desenvolvimento e como visualizar o ambiente de produção.

## Execução em Desenvolvimento com Docker

Para subir o ambiente de desenvolvimento com hot-reload do servidor, execute na raiz do repositório:

```bash
docker build -f Dockerfile.dev -t mkjs-dev .
docker run --rm -it -p 55555:55555 -v ${PWD}:/app mkjs-dev
```

O container inicia o backend em modo de desenvolvimento com `nodemon`. Como o código do projeto é montado por volume, alterações em `server/` e nos arquivos estáticos de `game/` ficam disponíveis imediatamente dentro do container; no navegador, basta atualizar a página para ver as mudanças de frontend.

## Execução com Docker Compose e Postgres

Para subir a aplicação junto com o banco Postgres em ambiente de desenvolvimento:

```bash
docker compose up --build
```

O `docker-compose.yml` sobe dois serviços, `app` e `db`, usando variáveis de ambiente para a conexão com o Postgres. A aplicação registra eventos simples de jogo na tabela `game_events`.

Observação: o serviço `app` é exposto no host na porta `55556` (mapeada para `55555` dentro do container). Acesse a aplicação em:

```
http://localhost:55556
```

Para verificar se o banco recebeu registros, rode uma ação no jogo e consulte a tabela:

```bash
docker compose exec db psql -U mkjs -d mkjs -c "SELECT id, event_type, created_at FROM game_events ORDER BY id DESC LIMIT 10;"
```

Se preferir, você também pode abrir o shell do Postgres com `docker compose exec db psql -U mkjs -d mkjs` e executar consultas manualmente.

## CI Build & Lint

A fase 3 adiciona o workflow [.github/workflows/ci.yml](.github/workflows/ci.yml), que roda em `push` e `pull_request`, instala as dependências com `npm ci` e executa `npm run lint` e `npm run build` dentro de `server/`.

## Testes Unitarios

A fase 4 adiciona testes unitarios com o Node Test Runner. Para executar localmente:

```bash
cd server
npm test
```

Na parte A da fase 4, existe um teste intencionalmente falhando para registrar a evidencia de CI quebrando antes da correcao.

## Testes de Fuzzing

A fase 5 adiciona testes de fuzzing no backend para validar entradas inesperadas em nomes de jogos recebidos pelos eventos de socket `create-game` e `join-game`. Para executar localmente:

```bash
cd server
npm run test:fuzz
```

O workflow de CI tambem executa `npm run test:fuzz` apos os testes unitarios.

## Seguranca SAST & SCA

A fase 6 adiciona verificacoes de seguranca ao pipeline de CI:

- SCA: `npm audit --audit-level=high`, para falhar o pipeline apenas em vulnerabilidades altas ou criticas nas dependencias.
- SAST: `eslint-plugin-security`, para detectar padroes inseguros no codigo backend Node.js. Achados do SAST sao reportados como avisos para nao bloquear a fase por falsos positivos simples, como acesso controlado ao mapa de partidas em memoria.

Para executar localmente:

```bash
cd server
npm run security
```

Tambem e possivel rodar cada verificacao separadamente:

```bash
npm run security:sca
npm run security:sast
```

O workflow de CI executa as verificacoes de seguranca depois dos testes unitarios e de fuzzing.

## SonarCloud

A fase 7 integra analise de qualidade de codigo com SonarCloud no GitHub Actions. A configuracao fica em `sonar-project.properties` e analisa os diretorios `server/` e `game/`, ignorando `server/node_modules/` e `game/images/`.

Para configurar no SonarCloud:

1. Crie/importe o projeto do repositorio `Dannyeclisson/GCES-projetoindividual`.
2. Confirme se o `projectKey` e a `organization` em `sonar-project.properties` batem com os valores mostrados no SonarCloud.
3. No GitHub, crie o secret `SONAR_TOKEN` em `Settings > Secrets and variables > Actions`.

O CI executa a analise com `SonarSource/sonarqube-scan-action` depois de build, lint, testes, fuzzing e verificacoes de seguranca. O token e lido por `${{ secrets.SONAR_TOKEN }}` e nao fica salvo no repositorio.

Estado de cobertura: os testes atuais usam Node Test Runner, mas ainda nao geram relatorio LCOV versionado para envio ao SonarCloud. Por isso, nesta fase a analise envia metricas de qualidade do codigo sem importar cobertura; quando houver LCOV, configure `sonar.javascript.lcov.reportPaths`.

Boa sorte!
