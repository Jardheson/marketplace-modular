// Bootstrap de OpenTelemetry - deve ser o PRIMEIRO import da aplicacao.
// Os instrumentos (http, express, pg) precisam ser aplicados antes que
// os modulos alvo sejam carregados, caso contrario nao havera instrumentacao.
import { initTracing } from './infra/observability/tracing';

initTracing();
