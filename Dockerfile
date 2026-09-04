# ==========================================
# 1. BUILD STAGE: Compile React Vite Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# ==========================================
# 2. RUNTIME STAGE: Production Node Backend + SQLite
# ==========================================
FROM node:20-alpine
WORKDIR /app

# Install native compile tools required by better-sqlite3
RUN apk add --no-cache python3 make g++

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

COPY server/ ./
# Copy built frontend assets into server public static folder
COPY --from=frontend-builder /app/client/dist ./public

# Data directory for SQLite database persistence
RUN mkdir -p /app/server/data

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "server.js"]
