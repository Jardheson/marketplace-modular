# Relatorios de desempenho

Execucao local em 2026-11-10. A API compilada rodou no host com Node.js 24.13.1; PostgreSQL 16.15 e Redis 7 rodaram em containers descartaveis. O k6 v2.3.0 tambem rodou em container. A base sintetica continha 500 produtos, 100.000 pedidos, 300.138 itens e 100.000 pagamentos.

Esta medicao usa uma unica instancia local da API, sem TLS e na mesma maquina que o gerador de carga. O runtime difere do Node.js 22 configurado no Docker de producao; portanto, os resultados sao indicativos para este ambiente, nao uma garantia de producao. O cache pode estar aquecido pelos estagios anteriores.

## k6

| Estagio | Perfil | Requisicoes | p95 | Media | Maximo | Falhas | Checks |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Smoke | 1 VU, 1 min | 60 | 4,76 ms | 5,71 ms | 132,95 ms | 0% | 120/120 |
| Stress | Ate 100 VUs, 7 min | 29.960 | 6,97 ms | 4,53 ms | 553,19 ms | 0% | 29.960/29.960 |
| Soak | 50 VUs, 40 min no total | 104.691 | 6,00 ms | 4,05 ms | 944,61 ms | 0% | 104.691/104.691 |

Os tres estagios passaram os limites k6 configurados: smoke e stress com `p95 < 500 ms` e falhas abaixo de 1%; o soak com `p95 < 800 ms` e falhas abaixo de 2%. O SLO de leitura documentado e p95 <= 200 ms; os valores observados ficaram abaixo dele nos tres estagios.

Arquivos brutos: [smoke](k6-smoke-summary.json), [stress](k6-stress-summary.json) e [soak](k6-soak-summary.json).

## PostgreSQL

Consultas executadas com `EXPLAIN (ANALYZE, BUFFERS)` na base descrita acima:

| Consulta | Plano observado | Tempo de execucao | Buffers |
| --- | --- | ---: | ---: |
| Produto por SKU | `idx_products_sku` | 0,089 ms | 3 shared hit |
| Pedidos por cliente e data | `idx_orders_customer` + sort | 0,235 ms | 7 shared hit |
| Pedidos por status com `LIMIT 20` | Seq Scan com parada antecipada | 0,046 ms | 2 shared hit |

Saidas completas: [produto por SKU](explain-product-sku.txt), [pedidos por cliente](explain-orders-customer.txt) e [pedidos por status](explain-orders-status.txt). Os tempos refletem uma base local aquecida e nao justificam extrapolacao para cargas ou hardware de producao.
