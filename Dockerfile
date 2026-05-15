FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better for caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client for database interactions
RUN npx prisma generate

# Open Port 3038 to match CloudPanel
EXPOSE 3038

# Start the application
CMD ["npm", "run", "start"]
