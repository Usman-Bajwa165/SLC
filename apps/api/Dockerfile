FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy package files for caching
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/

# Copy Prisma schema (lives at repo root)
COPY prisma/ ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps 2>/dev/null || true
RUN cd apps/api && npm install --legacy-peer-deps

# ── Builder ──────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY apps/api/src ./apps/api/src

WORKDIR /app/apps/api
RUN npx prisma generate --schema=../../prisma/schema.prisma
RUN npm run build

# ── Production ───────────────────────────────────────────────────────────────
FROM node:20-slim AS production
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY apps/api/package.json ./
COPY apps/api/tsconfig.json ./

EXPOSE 3001
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main"]
