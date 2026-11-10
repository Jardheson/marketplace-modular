<#
.SYNOPSIS
    Cria um Kanban (GitHub Projects V2) com os cards do processo de desenvolvimento.
.DESCRIPTION
    Requer gh CLI autenticado (gh auth login) com escopo project.
.NOTES
    Repo de referencia: Jardheson/marketplace-modular
#>
[CmdletBinding()]
param(
    [string]$Owner = "@me",
    [string]$Titulo = "Marketplace Modular - Kanban de Desenvolvimento"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "gh CLI nao encontrado. Instale e rode 'gh auth login --scopes project'."
}

Write-Host "Criando projeto '$Titulo'..." -ForegroundColor Cyan
$projectNumber = (gh project create --owner $Owner --title $Titulo --format json | ConvertFrom-Json).number
Write-Host "Projeto #$projectNumber criado." -ForegroundColor Green

$projectId = (gh project view $projectNumber --owner $Owner --format json | ConvertFrom-Json).id

$fieldsJson = gh project field-list $projectNumber --owner $Owner --format json | ConvertFrom-Json
$statusField = $fieldsJson.fields | Where-Object { $_.name -eq "Status" }
$statusFieldId = $statusField.id
$optionMap = @{}
foreach ($opt in $statusField.options) { $optionMap[$opt.name] = $opt.id }

$cards = [ordered]@{
    "K-01 Toolchain: Node 22, TypeScript 5, ESLint/Prettier, Vitest 4" = "Setup|Done"
    "K-02 Build multi-stage + tsconfig (dist/)"                        = "Setup|Done"
    "K-03 Seedwork de dominio (Entity, ValueObject, Money, Result)"    = "Setup|Done"
    "K-10 Modulo Catalogo (Repository + TypeORM + mappers)"            = "Modulos|Done"
    "K-11 Modulo Pedidos (CreateOrderUseCase + porta ICatalogService)" = "Modulos|Done"
    "K-12 Modulo Pagamentos (Strategy PIX/Cartao/Boleto)"              = "Modulos|Done"
    "K-13 Ports and Adapters entre modulos"                            = "Modulos|Done"
    "K-14 ADR 0001 - Decisao de persistencia (Repository Pattern)"     = "Modulos|Done"
    "K-15 Diagramas C4 (Contexto e Conteineres)"                       = "Modulos|Done"
    "K-20 Metricas RED em /metrics (prom-client)"                      = "Observabilidade|Done"
    "K-21b Tracing OpenTelemetry -> Jaeger (OTLP HTTP)"               = "Observabilidade|Done"
    "K-22b Grafana provisionado (datasource + dashboard RED)"          = "Observabilidade|Done"
    "K-23 Cache-aside tolerante a falhas (RedisCache)"                 = "Performance|Done"
    "K-24 Idempotencia de fila por jobId (BullMQ)"                     = "Performance|Done"
    "K-25 Validacao na borda (class-validator) + erro centralizado"    = "Testes e CI|Done"
    "K-26 Testes unitarios + contrato com cobertura >= 70%"            = "Testes e CI|Done"
    "K-27 Testes de integracao com Testcontainers"                     = "Testes e CI|Done"
    "K-28 OpenAPI 3.1 + lint Spectral na CI"                          = "Testes e CI|Done"
    "K-29 CI GitHub Actions (lint, typecheck, SCA, integracao, k6)"   = "Testes e CI|Done"
    "K-32 Feature flag FF_NEW_CHECKOUT documentada e testada"         = "Testes e CI|Done"
    "K-33 Smoke e stress k6"                                          = "Performance|Done"
    "K-21 Soak test k6 (50 VUs, 40 min)"                              = "Performance|In Progress"
    "K-22 EXPLAIN (ANALYZE, BUFFERS) nas queries criticas"            = "Performance|In Progress"
    "K-31 Configurar servicos Postgres/Redis no dashboard Railway"    = "Deploy|In Progress"
    "K-30 Deploy de producao no Railway (migrations no boot)"         = "Deploy|Todo"
}

$statusLabel = @{ "Todo" = "Backlog"; "In Progress" = "Em Andamento"; "Done" = "Concluido" }

$criados = 0
foreach ($titulo in $cards.Keys) {
    $partes = $cards[$titulo] -split "\|"
    $fase, $status = $partes[0], $partes[1]

    $itemJson = gh project item-create $projectNumber --owner $Owner `
        --title $titulo --body "Fase: $fase" --format json | ConvertFrom-Json
    $itemId = $itemJson.id

    $optionId = $optionMap[$status]
    if ($itemId -and $optionId) {
        gh project item-edit --project-id $projectId --id $itemId `
            --field-id $statusFieldId --single-select-option-id $optionId | Out-Null
    }
    $criados++
    Write-Host ("  [{0}] {1} -> {2}" -f $fase, $statusLabel[$status], $titulo) -ForegroundColor DarkGray
}

Write-Host "`n$criados cards criados no projeto #$projectNumber." -ForegroundColor Green
Write-Host "Abra: gh project view $projectNumber --owner $Owner --web" -ForegroundColor Cyan
