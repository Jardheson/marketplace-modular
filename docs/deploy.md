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
REDIS_PASSWORD=

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

- [ ] `curl https://<dominio>/health` retorna `200`.
- [ ] `curl https://<dominio>/metrics` expõe as métricas RED.
- [ ] Logs do primeiro boot indicam as migrations aplicadas.

## Estado da publicação

A configuração e a migração inicial estão versionadas, mas nenhum projeto Railway foi conectado nem publicado neste workspace. Isso requer uma conta Railway e autorização do responsável pelo ambiente; a validação local da migração requer Docker em execução.
