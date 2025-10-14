# Stage 1: build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app

COPY municipal-nextjs/package*.json ./
COPY municipal-nextjs/tsconfig.json ./
COPY municipal-nextjs/next.config.js ./
RUN npm ci

COPY municipal-nextjs/ ./
RUN npm run build

# Stage 2: production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only necessary files from build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "./node_modules/next/dist/bin/next", "start"]
