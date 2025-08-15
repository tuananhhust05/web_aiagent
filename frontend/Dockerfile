# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including vite for preview server)
RUN npm install

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5173

# Start Vite preview server
CMD ["npm", "run", "start"] 