const { PrismaClient } = require('@prisma/client');

// Force evaluation of the Docker runtime network connection link
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://admin:securepassword@db:5432/hospital_db?schema=public"
    }
  },
  log: ['error', 'warn']
});

module.exports = prisma;
