# Stage 1: builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps with legacy peer resolution to avoid ERESOLVE on apollo packages
COPY package*.json ./
RUN npm config set legacy-peer-deps true && npm install

# Copy sources and build
COPY nest-cli.json tsconfig*.json ./
COPY src ./src
RUN npm run build

# Stage 2: runner
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]