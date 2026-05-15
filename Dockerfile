FROM node:20-alpine

WORKDIR /app

# Install native operating system cryptographic libraries
RUN apk add --no-cache openssl openssl-dev

# Bundle dependency maps
COPY package*.json ./
RUN npm install

# Copy all application codebase files
COPY . .

# Force absolute baseline code verification
RUN mkdir -p prisma && touch prisma/seed.js

# Generate the type-safe data communication layer
RUN npx prisma generate

EXPOSE 3038

CMD ["npm", "run", "start"]
