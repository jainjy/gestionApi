// scripts/fix-sequence.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSequence() {
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('"Service"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Service"), 0) + 1,
      false
    )
  `;
  console.log('✅ Séquence resynchronisée');
  await prisma.$disconnect();
}

fixSequence().catch(console.error);