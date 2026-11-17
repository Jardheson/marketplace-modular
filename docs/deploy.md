# Estratégia de deploy

## Decisão

O alvo escolhido é **Railway**, publicando a imagem pelo `Dockerfile` e usando PostgreSQL e Redis gerenciados como serviços separados. O arquivo `railway.json` configura build, health check em `/health` e reinício em falhas.

O deploy deve ocorrer a partir da branch principal após a CI passar. O Railway pode acompanhar essa branch e publicar o container; alterações de banco são aplicadas pela migração versionada durante a inicialização em `NODE_ENV=production`.

## Configuração obrigatória

No projeto Railway, crie serviços PostgreSQL e Redis e configure no serviço da API:

- `NODE_ENV=production`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` com as referências privadas do serviço PostgreSQL
- `REDIS_HOST`, `REDIS_PORT` e, quando habilitado, `REDIS_PASSWORD` com as referências privadas do serviço Redis
- `JWT_SECRET` com um segredo aleatório exclusivo de produção
- `OTEL_ENABLED=false` ou `OTEL_ENABLED=true` junto com um `OTEL_EXPORTER_OTLP_ENDPOINT` acessível pela aplicação
- `FF_NEW_CHECKOUT=false` inicialmente; habilite após validar o novo fluxo

Não use as credenciais padrão do `docker-compose.yml` em produção. Não grave tokens nem segredos no repositório.

## Passo a passo (checklist de execução)

Pré-requisitos: conta Railway, repositório `Jardheson/marketplace-modular` no GitHub e CI verde na `main`.

### 1. Criar o projeto

- [ ] Railway → **New Project** → **Deploy from GitHub repo** → `Jardheson/marketplace-modular`, branch `main`.
- [ ] Confirmar que o builder foi detectado como **Dockerfile** (definido em `railway.json`).

### 2. Provisionar os serviços de dados

- [ ] **New → Database → Add PostgreSQL** — renomear o serviço para **`Postgres`**.
- [ ] **New → Database → Add Redis** — renomear o serviço para **`Redis`**.

Os nomes `Postgres` e `Redis` são obrigatórios: as referências `${{Postgres.*}}` e `${{Redis.*}}` são resolvidas por nome. Se a interpolação falhar, o serviço não sobe.

### 3. Configurar as variáveis do serviço da API

Aba **Variables** → **Raw Editor**:

```ini
NODE_ENV=production
PORT=3000
TZ=America/Sao_Paulo

DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_LOGGING=false

REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}

JWT_SECRET=<segredo aleatório exclusivo de produção>
JWT_EXPIRES_IN=7d

CACHE_TTL_SECONDS=300
OTEL_ENABLED=false
OTEL_SERVICE_NAME=marketplace-api
FF_NEW_CHECKOUT=false
LOG_LEVEL=info
```

- [ ] `JWT_SECRET` gerado com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- [ ] `OTEL_EXPORTER_OTLP_ENDPOINT` só é necessário se `OTEL_ENABLED=true`; mantenha `false` no primeiro deploy.

### 4. Expor a API

- [ ] Serviço da API → **Settings → Networking → Generate Domain**.

### 5. Ordem de deploy

- [ ] Definir no serviço da API a dependência para `Postgres` e `Redis`, para evitar boot loop caso a API suba antes dos serviços de dados.

### 6. Verificar

- [x] `curl https://imaginative-communication-production-ffd35873.up.railway.app/health` retorna `200`.
- [x] `curl https://imaginative-communication-production-ffd35873.up.railway.app/metrics` expõe as métricas RED.
- [x] Logs do primeiro boot indicam as migrations aplicadas.

Validação executada em `2026-11-17`, projeto `graceful-generosity`, ambiente `production`,
domínio `https://imaginative-communication-production-ffd35873.up.railway.app`:

| Verificação | Resultado |
| --- | --- |
| `GET /health` | `200` — `{"status":"ok",...}` |
| `GET /metrics` | `200` — expõe `http_requests_total`, `http_errors_total` e `http_request_duration_ms` (RED) |
| `GET /api/v1/products` | `200` — `{"data":[...],"page":1,"pageSize":1,"total":36,"totalPages":36}` (catálogo com 36 produtos) |
| `GET /api/v1/orders` | `200` — paginação análoga |
| `POST /api/v1/categories` | `400` — `VALIDATION_ERROR` para corpo `{}` (rota publicada e validação na borda ativa) |
| `POST /api/v1/products` | `400` — `VALIDATION_ERROR` para corpo `{}` |
| `POST /api/v1/orders` | `400` — `VALIDATION_ERROR` para corpo `{}` |
| `GET /api-docs/` | `200` |
| Migrations | `categories`, `products` e `orders` existem e respondem a `SELECT` |
| Logs de boot | `Banco de dados conectado.` → `Workers de fila registrados.` → `API iniciada.` |

O caminho de escrita (`POST /api/v1/products`) exige uma categoria previamente cadastrada. A criação de categorias é exposta por `POST /api/v1/categories` (mesmo contrato em `docs/openapi.yaml`) e é exercitada pelo teste de contrato `tests/contract/catalog.contract.test.ts`. A rota foi confirmada em produção em `2026-11-17`: responde `400` com `VALIDATION_ERROR` para um corpo inválido, comprovando que está publicada e validando na borda.

Existe também um seed sintético (`npm run seed`) que popula 20 categorias, 500 produtos e 100.000 pedidos. Ele é voltado a desenvolvimento e carga: executa `TRUNCATE` em todas as tabelas e **não deve ser rodado em produção**.

## Estado da publicação

Publicado e operacional no Railway: projeto `graceful-generosity`, ambiente `production`, serviço `imaginative-communication`. PostgreSQL e Redis são serviços gerenciados (`Postgres` e `Redis`); a migração inicial é aplicada no boot via `migrationsRun: true`.

- API pública: `https://imaginative-communication-production-ffd35873.up.railway.app`
- Health check: `https://imaginative-communication-production-ffd35873.up.railway.app/health`
- Swagger UI: `https://imaginative-communication-production-ffd35873.up.railway.app/api-docs`
- Métricas RED: `https://imaginative-communication-production-ffd35873.up.railway.app/metrics`
