FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application
COPY . .

# Expose port
EXPOSE 3000

# Development command (override in docker-compose for dev)
CMD ["npm", "run", "dev"]
