# Kanban — Processo de Desenvolvimento (Marketplace Modular)

> Quadro de acompanhamento do Projeto Final (Full Cycle, Módulo 4).
> Fluxo: **Backlog → Em Andamento → Revisão → Concluído**.
> Última atualização: 2026-11-10.

## Legenda de status

| Símbolo | Status       | Significado                               |
| ------- | ------------ | ----------------------------------------- |
| ✅      | Concluído    | Implementado, testado e commitado         |
| 🟡      | Revisão      | Implementado, aguardando validação final  |
| 🔵      | Em Andamento | Trabalho ativo                            |
| ⚪      | Backlog      | Planejado, não iniciado                   |

Pipeline de entrega:

    Toolchain ─▶ Módulos ─▶ Observabilidade ─▶ Testes & CI ─▶ Performance ─▶ Deploy
        ✅           ✅            ✅               ✅             ✅           🔵

---

## ⚪ Backlog

| ID   | Card                                                          | Fase   | Depende de |
| ---- | ------------------------------------------------------------- | ------ | ---------- |
| K-30 | Deploy de produção no Railway (`railway.json`, migrations no boot) | Deploy | K-21, K-22 |

## 🔵 Em Andamento

| ID   | Card                                                                | Fase   | Notas                                                                     |
| ---- | ------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| K-31 | Configurar serviços `Postgres`/`Redis` no dashboard e interpolação `${{...}}` | Deploy | Conta criada; nomes de serviço devem coincidir com as env vars |

## 🟡 Revisão

| ID   | Card                                          | Fase        | Evidência                                                                        |
| ---- | --------------------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| K-21 | Soak test k6 (50 VUs, 40 min)                 | Performance | [k6-soak-summary.json](performance/k6-soak-summary.json) — p95 6 ms, 0% falhas    |
| K-22 | `EXPLAIN (ANALYZE, BUFFERS)` nas queries críticas | Performance | [explain-*](performance/) — índices `idx_products_sku`, `idx_orders_customer`   |

## ✅ Concluído

| ID    | Card                                                                        | Fase             | Evidência                                                                            |
| ----- | --------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| K-01  | Toolchain: Node 22, TypeScript 5, ESLint/Prettier, Vitest 4                  | Setup            | [package.json](../package.json)                                                      |
| K-02  | Build multi-stage + `tsconfig` (`dist/`)                                     | Setup            | [Dockerfile](../Dockerfile)                                                          |
| K-03  | Seedwork de domínio (`Entity`, `ValueObject`, `Money`, `Result`, `AppError`) | Setup            | [src/shared/domain](../src/shared/domain)                                            |
| K-10  | Módulo **Catálogo**: entidades, use cases, Repository + TypeORM              | Módulos          | [src/modules/catalog](../src/modules/catalog)                                        |
| K-11  | Módulo **Pedidos**: `CreateOrderUseCase`, porta `ICatalogService`            | Módulos          | [src/modules/orders](../src/modules/orders)                                          |
| K-12  | Módulo **Pagamentos**: Strategy (PIX/Cartão/Boleto) + `PaymentStrategyResolver` | Módulos       | [src/modules/payments](../src/modules/payments)                                      |
| K-13  | Ports & Adapters entre módulos                                              | Módulos          | `CatalogServiceAdapter`, `OrderServiceAdapter`                                       |
| K-14  | ADR 0001 — decisão de persistência (Repository Pattern)                      | Módulos          | [adr/0001-decisao.md](adr/0001-decisao.md)                                           |
| K-15  | Diagramas C4 (Contexto e Contêineres)                                        | Módulos          | [docs/c4](c4/)                                                                       |
| K-20  | Métricas RED em `/metrics` (prom-client)                                     | Observabilidade  | [metrics.ts](../src/infra/observability/metrics.ts)                                  |
| K-21b | Tracing OpenTelemetry → Jaeger (OTLP HTTP)                                   | Observabilidade  | [tracing.ts](../src/infra/observability/tracing.ts)                                  |
| K-22b | Grafana provisionado (datasource + dashboard RED)                            | Observabilidade  | [observability/grafana](observability/grafana)                                       |
| K-23  | Cache-aside tolerante a falhas (`RedisCache`)                                | Performance      | [RedisCache.ts](../src/infra/cache/RedisCache.ts)                                    |
| K-24  | Idempotência de fila por `jobId` (SHA-256) + BullMQ                          | Performance      | [paymentWorker.ts](../src/modules/payments/infra/queue/paymentWorker.ts)             |
| K-25  | Validação na borda (`class-validator`) + erro centralizado                   | Testes & CI      | [validateBody.ts](../src/interface/http/middlewares/validateBody.ts)                 |
| K-26  | Testes unitários + contrato com cobertura ≥ 70%                              | Testes & CI      | [tests/unit](../tests/unit), [tests/contract](../tests/contract)                     |
| K-27  | Testes de integração com Testcontainers                                      | Testes & CI      | [tests/integration](../tests/integration)                                            |
| K-28  | OpenAPI 3.1 + lint Spectral na CI                                            | Testes & CI      | [docs/openapi.yaml](openapi.yaml)                                                    |
| K-29  | CI GitHub Actions: lint, typecheck, SCA, cobertura, integração, k6 smoke     | Testes & CI      | [.github/workflows/ci.yml](../.github/workflows/ci.yml)                              |
| K-32  | Feature flag `FF_NEW_CHECKOUT` documentada e testada                         | Testes & CI      | [feature-flags.ts](../src/shared/infrastructure/feature-flags.ts)                    |
| K-33  | Smoke e stress k6                                                            | Performance      | [k6/](../k6)                                                                         |

## Regras do fluxo

- Um card por entrega verificável; **entra em ✅ apenas com evidência** (teste, relatório k6, `EXPLAIN`, link de código).
- **Revisão** = pronto no código, pendente de validação automatizada final.
- Pendências não podem ser mascaradas (regra *Fail Loud*).
