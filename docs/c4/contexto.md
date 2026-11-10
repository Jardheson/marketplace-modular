# C4 - Contexto do Marketplace

## Diagrama de Contexto (C4 Level 1)

```mermaid
graph TB
    Cliente[Cliente<br/>Mobile / Web] -->|HTTPS| API[Marketplace API<br/>Monólito Modular]
    Admin[Administrador] -->|HTTPS| API
    API -->|CRUD / Consulta| PG[(PostgreSQL<br/>Catálogo + Pedidos + Pagamentos)]
    API -->|Cache + Fila| Redis[(Redis<br/>Cache + BullMQ)]
    API -->|Logs| Pino[Pino<br/>Logs estruturados]
    API -->|Métricas RED| Prom[Prometheus + Grafana]
    API -->|Tracing| Jaeger[Jaeger<br/>OpenTelemetry]
    API -->|CI/CD| GH[GitHub Actions]
```

## Descrição

O **Marketplace API** é um monólito modular que expõe endpoints REST para:
- **Catálogo**: produtos e categorias.
- **Pedidos**: criação e consulta de pedidos (reserva de estoque no catálogo).
- **Pagamento**: processamento via PIX, Cartão de Crédito e Boleto (Strategy Pattern).

Componentes externos:
- **PostgreSQL**: persistência transacional.
- **Redis**: cache tolerante a falhas e fila BullMQ (idempotente via `jobId`).
- **Prometheus/Grafana**: métricas RED (Rate, Errors, Duration).
- **Jaeger**: tracing distribuído via OpenTelemetry.
- **GitHub Actions**: pipeline de CI/CD.
