FROM node:20-alpine

WORKDIR /app

# Install cryptographic system bindings for Prisma
RUN apk add --no-cache openssl openssl-dev

# Cache dependency maps
COPY package*.json ./
RUN npm install

# Copy all application assets cleanly
COPY . .

# Generate the type-safe client data layers
RUN npx prisma generate

EXPOSE 3038

CMD ["npm", "run", "start"]
