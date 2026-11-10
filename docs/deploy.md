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

## Estado da publicação

A configuração e a migração inicial estão versionadas, mas nenhum projeto Railway foi conectado nem publicado neste workspace. Isso requer uma conta Railway e autorização do responsável pelo ambiente; a validação local da migração requer Docker em execução.
