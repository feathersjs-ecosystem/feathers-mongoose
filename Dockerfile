FROM --platform=linux/arm64 node:18-slim

WORKDIR /app

# Install build tools and system dependencies for native modules
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libkrb5-dev \
    libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --no-optional

# Copy the rest of the application
COPY . .

# Fix mocha permissions
RUN chmod +x node_modules/.bin/mocha

# Set environment variables
ENV NODE_ENV=test

# Command to run tests
CMD ["node", "node_modules/.bin/mocha", "--timeout", "15000", "--recursive", "test/", "--exit"]
