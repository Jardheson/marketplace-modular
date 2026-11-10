# ADR 0001 - Escolha do Padrão de Persistência e Arquitetura do Marketplace

- **Status**: Aceito
- **Data**: 2026-11-10
- **Decisores**: Jardheson Oliveira

## Contexto

O Projeto Final (Módulo 4 - Full Cycle) exige um Marketplace como **monólito modular** com módulos de catálogo, pedidos e pagamento. É necessário aplicar um **Database Pattern** justificado e registrar a decisão.

## Decisão

Adotamos **TypeORM com o padrão Repository** como Database Pattern, em conjunto com **Clean Architecture** (camadas domain / application / infra / interface) e o padrão **Strategy** para métodos de pagamento.

## Alternativas Consideradas

### 1. TypeORM + Repository Pattern (escolhida)
- **Prós**: Maturidade, suporte a decorators, integração com PostgreSQL, separação clara entre domínio e infraestrutura via mappers.
- **Contras**: Overhead de configuração, "magic" dos decorators.

### 2. Prisma (descartada)
- **Prós**: DX excelente, migrations automáticas, type-safety forte.
- **Contras**: Menos flexível para mapeamento domínio↔persistência; acopla o modelo de domínio ao schema do Prisma, dificultando a isolamento de camadas.

### 3. Knex + Query Builder (descartada)
- **Prós**: Leve, controle total das queries.
- **Contras**: Mais código boilerplate; sem mapeamento objeto-relacional, exigindo mappers manuais extensos.

## Padrões Aplicados

- **Repository Pattern** (M1 - Database Pattern): abstrai a camada de persistência atrás de interfaces definidas no domínio (`IProductRepository`, `IOrderRepository`, `IPaymentRepository`).
- **Strategy Pattern** (M1 - 1 pattern justificado): `IPaymentStrategy` com implementações `PixStrategy`, `CreditCardStrategy`, `BoletoStrategy`, resolvidas por `PaymentStrategyResolver`. Permite adicionar novos meios de pagamento sem alterar o caso de uso (Open/Closed Principle).

## Consequências

- Positivas: isolamento do domínio, testabilidade, extensibilidade dos métodos de pagamento.
- Negativas: necessidade de mappers manuais entre entidades de domínio e entidades TypeORM.
