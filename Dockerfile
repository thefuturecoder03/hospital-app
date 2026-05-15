FROM node:20-alpine

WORKDIR /app

# Install native operating system dependencies required by Prisma
RUN apk add --no-cache openssl openssl-dev

# Install library dependencies (cached layers)
COPY package*.json ./
RUN npm install

# Bundle application source code
COPY . .

# Generate the Prisma database client
RUN npx prisma generate

EXPOSE 3038

CMD ["npm", "run", "start"]
