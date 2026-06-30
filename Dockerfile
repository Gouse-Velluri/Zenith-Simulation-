# ─── Stage 1: Install dependencies ─────────────────────────────────────────
FROM node:20-alpine AS deps

# Install bun
RUN npm install -g bun@1

WORKDIR /app

# Copy root package files
COPY package.json bun.lock ./

# Install root dependencies
RUN bun install --frozen-lockfile

# Install mini-service dependencies
COPY mini-services/chat-service/package.json ./mini-services/chat-service/
RUN cd mini-services/chat-service && bun install --frozen-lockfile

# ─── Stage 2: Build Next.js ────────────────────────────────────────────────
FROM deps AS builder

WORKDIR /app
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN bun run build

# ─── Stage 3: Production ───────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install caddy and supervisord
RUN apk add --no-cache caddy supervisor

# Install bun for mini-services
RUN npm install -g bun@1

WORKDIR /app

# Create persistent data directory for SQLite
RUN mkdir -p /data

# Copy standalone Next.js output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema & client for DB migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Copy mini-services
COPY --from=builder /app/mini-services ./mini-services
COPY --from=deps /app/mini-services/chat-service/node_modules ./mini-services/chat-service/node_modules

# Copy configuration files
COPY Dockerfile.caddy /etc/caddy/Caddyfile
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Railway exposes this port — Caddy listens here
ENV PORT=3000

EXPOSE 3000

CMD ["/app/start.sh"]