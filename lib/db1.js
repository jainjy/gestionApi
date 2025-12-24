const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

/* ======================
   PRISMA (CRUD)
====================== */
const prisma = new PrismaClient({
  log: ['error'], // évite le bruit
});

/* ======================
   PG POOL (requêtes lourdes)
====================== */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  max: 10,                        // ⬅️ LIMITE CONNEXIONS
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,  // ⬅️ STOP timeout
  statement_timeout: 15000        // ⬅️ STOP requêtes lentes
});

/* ======================
   LOG ERREUR POOL
====================== */
pool.on('error', (err) => {
  console.error('❌ Erreur PG Pool:', err.message);
});

/* ======================
   FERMETURE PROPRE
====================== */
process.on('SIGINT', async () => {
  console.log('🛑 Fermeture des connexions DB...');
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});

module.exports = { prisma, pool };
