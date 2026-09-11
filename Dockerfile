FROM node:20-alpine AS base
# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci
# Generate Prisma client
RUN npx prisma generate

# Build + run database migration & seed
FROM base AS builder
WORKDIR /app
# Set database url for migration during build
ENV DATABASE_URL="file:./prisma/prod.db"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Execute database migration and seed data during build
RUN npx prisma migrate deploy
RUN npx tsx prisma/seed.ts
RUN npm run build

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL="file:./prisma/prod.db"
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
# Copy pre-built database file into final image
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Set up standalone output
RUN mkdir .next
RUN chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD node server.js
