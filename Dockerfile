FROM node:20-alpine

WORKDIR /app

# Install native cryptographic system bindings
RUN apk add --no-cache openssl openssl-dev

# Cache package maps
COPY package*.json ./
RUN npm install

# Bundle entire application layer assets
COPY . .

# Force absolute system directory baseline compliance
RUN mkdir -p prisma && \
    echo "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { console.log('Inline seed active'); } main().finally(() => prisma.\$disconnect());" > prisma/seed.js

# Compile data client configurations
RUN npx prisma generate

EXPOSE 3038

CMD ["npm", "run", "start"]
