# Contribuidores

## Autor Principal

- **Jardheson de Oliveira** — Engenheiro de Software / Arquiteto de Software
  - GitHub: [Jardheson](https://github.com/Jardheson)
  - LinkedIn: [Jardheson Oliveira](https://www.linkedin.com/in/jardheson-oliveira-886a40140/)

Projeto desenvolvido de forma individual para o Projeto Final do Módulo 4 (Full Cycle).

## Como contribuir

1. Faça um **fork** do repositório
2. Crie uma branch para sua feature:
   ```bash
   git checkout -b feature/nome-da-feature
   ```
3. Commit suas mudanças seguindo [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` novas funcionalidades
   - `fix:` correções de bugs
   - `refactor:` refatoração sem mudança de comportamento
   - `docs:` alterações apenas em documentação
   - `test:` adição ou correção de testes
   - `chore:` tarefas de manutenção (build, CI, dependências)
4. Faça push da branch:
   ```bash
   git push origin feature/nome-da-feature
   ```
5. Abra um **Pull Request** descrevendo a mudança

## Padrões do projeto

### Stack
- Node.js 22.15+, TypeScript 5.6 (target ES2022)
- Express 4, TypeORM 0.3, PostgreSQL 16, Redis 7, BullMQ 5
- Vitest 4, Testcontainers, Supertest, k6
- Pino (logs), prom-client (métricas RED), OpenTelemetry + Jaeger (tracing)

### Qualidade de código
- **Lint**: `npm run lint` (ESLint + Prettier)
- **Formatação automática**: `npm run lint:fix`
- **Typecheck**: `npm run typecheck` (tsc --noEmit)
- **Build**: `npm run build` (tsc -p tsconfig.build.json)

### Testes
- **Unitários + contrato**: `npm test`
- **Integração** (Testcontainers / Docker): `npm run test:integration`
- **Cobertura** (threshold 70%): `npm run test:coverage`

Todos os testes devem passar antes de abrir um PR. A cobertura mínima é de **70%** em statements, branches, functions e lines.

### Arquitetura
- Clean Architecture por módulo: `domain` → `application` → `infra` → `interface`
- Repository Pattern com mappers de domínio ↔ persistência
- Strategy Pattern para métodos de pagamento
- Ports and Adapters entre módulos
- Não adicione dependências de framework no `domain`

## Reportando issues

Use o [Issues](https://github.com/Jardheson/marketplace-modular/issues) do GitHub. Inclua passos para reproduzir, comportamento esperado e logs relevantes.

## Licença

Projeto de caráter acadêmico (Projeto Final Full Cycle — Módulo 4).
