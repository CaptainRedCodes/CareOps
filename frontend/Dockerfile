# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files first for caching
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install deps
RUN npm install

# Copy app source
COPY . .

# Build React app
RUN npm run build