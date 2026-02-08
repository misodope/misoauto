# Use Node.js 20 as base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy root package files and workspace package.json files for npm workspaces
COPY package*.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci
COPY tsconfig.base.json ./
COPY backend ./backend
WORKDIR /app/backend
# Generate Prisma client
RUN npx prisma generate --schema=src/database/schema.prisma
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# Build stage
FROM base AS build
RUN npm ci
COPY tsconfig.base.json ./
COPY backend ./backend
WORKDIR /app/backend
# Generate Prisma client and build the application
RUN npx prisma generate --schema=src/database/schema.prisma && npx nest build

# Production stage
FROM node:20-alpine AS production

# Create app directory
WORKDIR /app

# Copy root package files and workspace package.json files for npm workspaces
COPY package*.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Copy Prisma schema first
COPY --from=build /app/backend/src/database ./prisma

# Install only production dependencies and generate Prisma client
RUN npm ci --omit=dev && \
    npx prisma generate --schema=./prisma/schema.prisma && \
    npm cache clean --force

# Copy built application from backend (output is at /app/dist/backend per tsconfig)
COPY --from=build /app/dist/backend ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1 || exit 1

# Start the application
CMD ["node", "dist/backend/src/main"]
