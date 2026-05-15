const { PrismaClient } = require('@prisma/client');

// Use Docker runtime variables if the local .env file is hidden
const databaseUrl = process.env.DATABASE_URL || "postgresql://admin:securepassword@db:5432/hospital_db?schema=public";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: ['error', 'warn'],
});

module.exports = prisma;
