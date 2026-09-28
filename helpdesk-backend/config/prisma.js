const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Log query SQL ke console (opsional, sangat berguna saat development)
});

module.exports = prisma;
