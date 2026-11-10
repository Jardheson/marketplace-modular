# Marketplace Modular — Projeto Final Full Cycle (Módulo 4)

Marketplace como **monólito modular** (catálogo, pedidos, pagamento) implementado em Node.js + TypeScript, seguindo Clean Architecture.

## Tecnologias

- **Runtime**: Node.js 22.15+ / TypeScript 5 (target ES2022)
- **Web**: Express 4 com `helmet` e CORS
- **ORM**: TypeORM 0.3 (Repository Pattern e migrations versionadas com `up`/`down`)
- **Banco**: PostgreSQL 16
- **Cache/Fila**: Redis 7 + BullMQ (cache-aside e jobs idempotentes por `jobId`)
- **Validação**: class-validator + class-transformer
- **Testes**: Vitest 4, Supertest e Testcontainers
- **Carga**: k6 (smoke, stress e soak)
- **Observabilidade**: pino (logs), prom-client (métricas RED), OpenTelemetry (OTLP HTTP) + Jaeger (tracing)
- **Documentação**: OpenAPI 3.1 + Swagger UI, com lint por Spectral na CI
- **Contêineres**: Dockerfile multi-stage e Docker Compose (app, PostgreSQL, Redis, Prometheus, Grafana e Jaeger)
- **CI/CD**: GitHub Actions (lint, typecheck, Spectral, SCA, cobertura, integração e smoke k6)
- **Deploy**: Railway com Dockerfile e health check em `/health`

## Estrutura

```
.
├── docker-compose.yml
├── README.md
├── observability/        # Prometheus + Grafana (datasource e dashboard RED provisionados)
├── docs/
│   ├── adr/0001-decisao.md
│   ├── c4/contexto.md
│   ├── c4/containers.md
│   ├── deploy.md
│   ├── openapi.yaml
│   └── desempenho.md
├── src/
│   ├── config/           # Variáveis de ambiente
│   ├── shared/           # Seedwork de domínio (Entity, ValueObject, AppError, Money)
│   ├── infra/            # Banco, cache, fila, observabilidade
│   ├── modules/
│   │   ├── catalog/      # domain / application / infra / interface
│   │   ├── orders/
│   │   └── payments/     # Strategy Pattern (PIX, Cartão, Boleto)
│   ├── interface/http/   # Middlewares (erro, métricas, validação)
│   ├── app.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/      # Testcontainers
│   └── contract/
├── k6/                   # Smoke, stress, soak
├── scripts/seed.ts       # 100 mil pedidos sintéticos
└── .github/workflows/ci.yml
```

## Como subir (1 comando)

```bash
docker-compose up -d
```

Aplicação em `http://localhost:3000`, Swagger em `/api-docs`, métricas em `/metrics`.

## Observabilidade

- **Métricas**: a aplicação expõe métricas RED em `/metrics` na própria porta HTTP (`3000`). O Prometheus ([observability/prometheus.yml](observability/prometheus.yml)) raspa `app:3000/metrics` a cada 15s; UI em `http://localhost:9090`.
- **Dashboards**: o Grafana (`http://localhost:3001`, admin/admin) sobe com datasource e o dashboard RED `marketplace-red` provisionados a partir de [observability/grafana](observability/grafana), versionados no repositório.
- **Tracing**: spans são exportados via OTLP HTTP para o Jaeger em `http://jaeger:4318/v1/traces`; UI em `http://localhost:16686`.

## Desenvolvimento local

```bash
cp .env.example .env
npm install
npm run dev
```

## Testes

```bash
npm test                    # unitários + contrato
npm run test:integration    # integração (Testcontainers)
npm run test:coverage       # com coverage
```

## Seed de dados (100 mil pedidos)

```bash
npm run seed
```

## k6 (3 estágios)

```bash
npm run k6:smoke    # 1 VU, 1 min
npm run k6:stress   # ramp 0→100 VUs
npm run k6:soak     # 50 VUs por 30 min, mais ramp-up/down de 5 min cada
```

Com o serviço iniciado e o banco/Redis disponíveis, gere um perfil de CPU:

```bash
npm run build
npm run profile:cpu
```

O processo cria um arquivo `.cpuprofile` ao encerrar. Ele pode ser aberto no Chrome DevTools. O Clinic.js foi avaliado, mas não foi adicionado porque a versão disponível introduz dependências com vulnerabilidades críticas; o profiler nativo do Node evita ampliar a superfície vulnerável.

Os resultados k6 e as consultas `EXPLAIN (ANALYZE, BUFFERS)` executados em ambiente local estão registrados em [docs/performance](docs/performance/README.md), junto das condições e limitações da medição. Eles não representam garantia de desempenho em produção.

## Padrões aplicados

A escolha do padrão de persistência e a justificativa estão registradas em [ADR 0001](docs/adr/0001-decisao.md).

- **Clean Architecture** (M1): cada módulo é dividido em `domain`, `application`, `infra` e `interface`, mantendo o domínio livre de framework e de detalhes de banco.
- **Repository Pattern** (M1 — Database Pattern): o domínio declara as interfaces (`IProductRepository`, `IOrderRepository`, `IPaymentRepository`) e a infraestrutura fornece as implementações TypeORM, com mappers explícitos entre entidade de domínio e entidade de persistência.
- **Strategy Pattern** (M1 — padrão justificado): `IPaymentStrategy` com `PixStrategy`, `CreditCardStrategy` e `BoletoStrategy`, resolvidas por `PaymentStrategyResolver`; novos meios de pagamento entram sem alterar o caso de uso (Open/Closed).
- **Ports and Adapters**: o tráfego entre módulos passa por portas e adaptadores (`CatalogServiceAdapter` em pedidos e `OrderServiceAdapter` em pagamentos), evitando acoplamento direto entre módulos.
- **Composition Root / injeção de dependências**: os módulos são montados por funções fábrica (`createCatalogModule`, `createOrdersModule`, `createPaymentsModule`) que recebem o `DataSource` e injetam repositórios, casos de uso e controladores.
- **Seedwork de domínio**: `Entity`, `ValueObject`, `AggregateRoot`, `Money`, `Result` (Either) e `AppError` como base compartilhada de modelagem e de tratamento de erro.
- **Cache-aside tolerante a falhas** (M4 — plano de p95): `RedisCache` aplica timeout por operação e degrada para consulta no banco quando o Redis falha; escritas invalidam as chaves por padrão (`products:*`, `orders:*`).
- **Idempotência de fila** (M4): o `jobId` é derivado por SHA-256 de pedido, método e cabeçalho `Idempotency-Key`, com três tentativas e backoff exponencial; repetir a requisição reutiliza o mesmo job em vez de duplicar o pagamento.
- **Validação na borda e erro centralizado**: middleware `validateBody` (class-validator) nos DTOs de entrada e um único `errorHandler` traduzindo `AppError` para respostas HTTP.

## Feature Flag

| Flag              | Padrão  | Efeito |
| ----------------- | ------- | ------ |
| `FF_NEW_CHECKOUT` | `false` | Quando habilitada, o checkout pré-valida todos os produtos (existência e atividade) antes de reservar qualquer estoque; desabilitada, a validação continua item a item durante a reserva. |

A flag é lida em `src/config/env.ts` e exposta por `src/shared/infrastructure/feature-flags.ts` via `isFeatureEnabled('newCheckout')`, consumida na composição do módulo de pedidos. Habilite com `FF_NEW_CHECKOUT=true` no `.env`, no `docker-compose.yml` ou nas variáveis do serviço de deploy. Os valores de leitura são cobertos por `tests/unit/config/env.test.ts` e o comportamento por `tests/unit/orders/CreateOrderUseCase.test.ts`.

## Autor

**Jardheson de Oliveira**
