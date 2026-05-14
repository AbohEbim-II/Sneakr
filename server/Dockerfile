# Base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json & install deps first (cache optimization)
COPY package*.json ./
RUN npm install

# Copy Prisma files separately (optional, improves caching)
COPY prisma ./prisma

# Copy all source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 7000

# Start server
CMD ["node", "dist/index.js"]
