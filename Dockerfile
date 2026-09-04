# ==========================================
# 1. BUILD STAGE: Compile React Vite Frontend
# ==========================================
FROM node:20-slim AS frontend-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# ==========================================
# 2. RUNTIME STAGE: Production Node Backend + SQLite
# ==========================================
FROM node:20-slim
WORKDIR /app

# Install build tools required for native C++ bindings (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev && npm rebuild better-sqlite3

COPY server/ ./
# Copy built frontend assets into server public static folder
COPY --from=frontend-builder /app/client/dist ./public

# Data directory for SQLite database persistence
RUN mkdir -p /app/server/data

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "server.js"]
