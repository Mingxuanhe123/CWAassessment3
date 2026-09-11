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

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# 在构建阶段执行db push（只构建时执行一次）
ENV DATABASE_URL="file:./prisma/dev.db"
RUN npx prisma db push --accept-data-loss

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL="file:./prod.db"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Set up standalone output
RUN mkdir .next
RUN chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 可选复制数据库文件，不存在则跳过，并修改文件权限
RUN if [ -f ./prisma/dev.db ]; then \
    cp ./prisma/dev.db ./prisma/prod.db && \
    chown nextjs:nodejs ./prisma/prod.db; \
fi

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 容器启动只运行next服务，不再执行prisma
CMD node server.js
