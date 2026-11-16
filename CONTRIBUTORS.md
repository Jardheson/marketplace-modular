# Contribuidores

## Autor Principal

- **Jardheson Oliveira** - Engenheiro de Software / Arquiteto de Software
  - GitHub: [Jardheson](https://github.com/Jardheson)
  - LinkedIn: [Jardheson Oliveira](https://www.linkedin.com/in/jardheson-oliveira-886a40140/)

Projeto desenvolvido de forma individual para o Projeto Final do Modulo 4 (Full Cycle).

## Como contribuir

1. Faca um fork do repositorio.
2. Crie uma branch para sua feature:

   git checkout -b feature/nome-da-feature

3. Commit suas mudancas seguindo Conventional Commits:
   - feat: novas funcionalidades
   - fix: correcoes de bugs
   - refactor: refatoracao sem mudanca de comportamento
   - docs: alteracoes apenas em documentacao
   - test: adicao ou correcao de testes
   - chore: tarefas de manutencao (build, CI, dependencias)
4. Faca push da branch:

   git push origin feature/nome-da-feature

5. Abra um Pull Request descrevendo a mudanca.

## Padroes do projeto

### Stack

- Node.js 22.15+, TypeScript 5.6 (target ES2022)
- Express 4, TypeORM 0.3, PostgreSQL 16, Redis 7, BullMQ 5
- Vitest 4, Testcontainers, Supertest, k6
- Pino (logs), prom-client (metricas RED), OpenTelemetry + Jaeger (tracing)

### Qualidade de codigo

- Lint: npm run lint (ESLint + Prettier)
- Formatacao automatica: npm run lint:fix
- Typecheck: npm run typecheck (tsc --noEmit)
- Build: npm run build (tsc -p tsconfig.build.json)

### Testes

- Unitarios + contrato: npm test
- Integracao (Testcontainers / Docker): npm run test:integration
- Cobertura (threshold 70%): npm run test:coverage

Todos os testes devem passar antes de abrir um PR. A cobertura minima e de 70% em statements, branches, functions e lines.

### Arquitetura

- Clean Architecture por modulo: domain -> application -> infra -> interface
- Repository Pattern com mappers de dominio <-> persistencia
- Strategy Pattern para metodos de pagamento
- Ports and Adapters entre modulos
- Nao adicione dependencias de framework no domain

## Reportando issues

Use o Issues do GitHub. Inclua passos para reproduzir, comportamento esperado e logs relevantes.

## Licenca

Projeto de carater academico (Projeto Final Full Cycle - Modulo 4).
