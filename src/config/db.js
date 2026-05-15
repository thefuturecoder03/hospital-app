const { PrismaClient } = require('@prisma/client');

// Initialize the Prisma database connection layer
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

module.exports = prisma;
