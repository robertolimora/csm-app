# =========================
# Stage 1: Builder
# =========================
FROM node:20-alpine AS builder
WORKDIR /app

# Dependências do sistema (Prisma/openssl)
RUN apk add --no-cache openssl

# pnpm via corepack (reprodutível)
RUN corepack enable && corepack prepare pnpm@10.30.0 --activate

# Copie apenas manifests para cache eficiente
COPY package.json pnpm-lock.yaml nx.json tsconfig.base.json pnpm-workspace.yaml ./

# Instala deps sem scripts (evita falha do postinstall do Prisma
# antes do schema existir no contexto de build)
RUN pnpm install --frozen-lockfile --ignore-scripts || pnpm install --no-frozen-lockfile --ignore-scripts

# Copie o restante do repo
COPY . .

# Normaliza CRLF do schema (se você edita no Windows)
RUN sed -i 's/\r$//' libs/api/core/prisma/schema.prisma || true

# Gera Prisma Client usando a versão instalada no workspace
RUN pnpm exec prisma generate --schema=libs/api/core/prisma/schema.prisma

# Build NX (modo CI/Docker)
ENV CI=true
ENV NX_DAEMON=false
RUN pnpm exec nx reset
RUN pnpm exec nx build api --configuration=production --skip-nx-cache

# =========================
# Stage 2: Runner (produção)
# =========================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copia apenas o necessário para rodar
COPY --from=builder /app/dist/apps/api ./dist/apps/api
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/apps/api/main.js"]
