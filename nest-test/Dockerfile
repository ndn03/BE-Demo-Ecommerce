# ------------------------------------------------------
# Development & Production Dockerfile for NestJS
# ------------------------------------------------------

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Install all dependencies including dev dependencies
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build the application
RUN npm run build

# Stage 3: Development runner
FROM node:20-alpine AS development
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
# 1. Nếu có file .env, copy vào
COPY .env* ./

# 2. Nếu không có file .env nào thì vẫn tạo file trống tránh lỗi
RUN touch /app/.env

# Expose API port
EXPOSE 3000
# Start in development mode (with hot reload)
CMD ["npm", "run", "start:dev"]

# Stage 4: Production runner
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
# Only install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
# Set appropriate permissions
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose API port
EXPOSE 3000
# Start in production mode
CMD ["node", "dist/main"]