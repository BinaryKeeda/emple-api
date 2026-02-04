# =========================
# Base (shared OS + Node)
# =========================
FROM node:18-alpine AS base
WORKDIR /app

# Proper signal handling + certs
RUN apk add --no-cache tini ca-certificates

ENV NODE_ENV=production

# =========================
# Dependencies (cached layer)
# =========================
FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# =========================
# Runtime base (non-root)
# =========================
FROM base AS runtime

# Create non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

WORKDIR /app

# Copy deps only once
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN chown -R nodejs:nodejs /app
USER nodejs

ENTRYPOINT ["/sbin/tini", "--"]

# =========================
# API CORE
# =========================
FROM runtime AS api-core
CMD ["npm", "run", "api"]

# =========================
# EVALUATOR
# =========================
FROM runtime AS evaluator
CMD ["npm", "run", "evaluator"]

# =========================
# WORKER
# =========================
FROM runtime AS worker
CMD ["npm", "run", "worker"]

# =========================
# CAMPUS WORKER
# =========================
FROM runtime AS campusworker
CMD ["npm", "run", "campusworker"]
