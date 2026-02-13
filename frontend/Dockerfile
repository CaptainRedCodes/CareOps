# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments with defaults for development
ARG VITE_API_URL=http://localhost:8000
ARG VITE_FRONTEND_URL=http://localhost:5173

# Set build arguments as environment variables
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FRONTEND_URL=$VITE_FRONTEND_URL

# Copy only package files first for caching
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install deps
RUN npm install

# Copy app source
COPY . .

# Build React app
RUN npm run build

# ---- Production stage ----
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
