# Evidências de desempenho

## SLOs-alvo

Estes valores são objetivos declarados, não resultados medidos:

| Indicador                                   | Objetivo |
| ------------------------------------------- | -------- |
| Disponibilidade                             | 99,9%    |
| Latência p95 (GET de produtos e pedidos)    | ≤ 200 ms |
| Latência p95 (POST de pedidos e pagamentos) | ≤ 500 ms |
| Taxa de erro 5xx                            | ≤ 0,1%   |

## Cache e fila

- Leituras paginadas e consultas por ID de produtos e pedidos usam cache-aside com TTL padrão de 300 segundos.
- Falhas no Redis retornam cache miss e deixam a consulta seguir para o banco.
- Criação de produtos invalida `products:*`; criação de pedidos e pagamentos invalidam `orders:*`, incluindo detalhes e listas com status atualizado.
- `QueueManager` configura `jobId`, três tentativas e backoff exponencial. O worker de pagamentos executa o caso de uso e a API aguarda o resultado do job para preservar o contrato HTTP atual. O teste de contrato cobre retry com a mesma chave idempotente.

## Testes k6

| Estágio | Arquivo        | Perfil configurado     | Estado neste workspace                     |
| ------- | -------------- | ---------------------- | ------------------------------------------ |
| Smoke   | `k6/smoke.js`  | 1 VU por 1 minuto      | Executado em 2026-11-10; passou            |
| Stress  | `k6/stress.js` | até 100 VUs, 7 minutos | Executado em 2026-11-10; passou            |
| Soak    | `k6/soak.js`   | até 50 VUs, 40 minutos | Executado em 2026-11-10; passou            |

Resultados, condicoes do ambiente, resumos JSON e saidas SQL estao em [docs/performance](performance/README.md). Os resultados sao locais e nao representam garantia de desempenho em producao.

Suba os serviços com `docker compose up -d`, então execute `npm run k6:smoke`, `npm run k6:stress` e `npm run k6:soak`. O job de CI executa o smoke test contra a API inicializada e publica o resumo k6 como artifact.

## Perfil de CPU

O Clinic.js não é instalado porque a versão disponível introduz dependências com vulnerabilidades críticas. Use o profiler nativo do Node como alternativa:

```bash
npm run build
npm run profile:cpu
```

Com a API e suas dependências rodando, gere carga durante o perfil e encerre o processo para gravar o arquivo `.cpuprofile`. Abra-o no Chrome DevTools para inspecionar hot paths.

## EXPLAIN ANALYZE

As consultas foram executadas em 2026-11-10 na base sintetica de 100.000 pedidos e 500 produtos. As saidas completas e o resumo dos planos estao em [docs/performance](performance/README.md).

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, price_cents
FROM products
WHERE sku = 'SKU-REPRESENTATIVO';

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, customer_id, status, created_at
FROM orders
WHERE customer_id = '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC
LIMIT 20;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, customer_id, status, created_at
FROM orders
WHERE status = 'PENDING'
LIMIT 20;
```

Os índices declarados nas entidades cobrem SKU, categoria, cliente e status. A existência do índice não substitui a medição do plano real; os resultados devem orientar qualquer otimização adicional.
