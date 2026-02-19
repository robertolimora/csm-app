# CSM App Monorepo

Monorepo Nx com:

- `apps/api`: API NestJS
- `apps/web`: Front-end Angular
- `libs/api/*`: bibliotecas compartilhadas de domínio/infra da API

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- Docker e Docker Compose (opcional, para PostgreSQL/Redis)

## Setup local

1. Instalar dependências:

```bash
pnpm install
```

2. Gerar Prisma Client:

```bash
pnpm prisma:generate
```

3. Subir banco/cache (opcional com Docker):

```bash
pnpm db:up
```

4. Configurar variáveis de ambiente (exemplo):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medcore
REDIS_URL=redis://localhost:6379
PORT=3000
CORS_ORIGIN=http://localhost:4200
```

> Em produção, `CORS_ORIGIN` é obrigatório.

## Desenvolvimento

Executar API:

```bash
pnpm nx serve api
```

Executar Web:

```bash
pnpm nx serve web
```

## Build

Build API:

```bash
pnpm nx build api
```

Build Web:

```bash
pnpm nx build web
```

## Banco de dados

Gerar migration:

```bash
pnpm db:migrate
```

Seed:

```bash
pnpm db:seed
```
