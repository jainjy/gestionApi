const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.query('SELECT NOW()', (err) => {
  if (err) console.error('❌ Erreur de connexion PostgreSQL:', err.message);
  else console.log('✅ Connecté à PostgreSQL');
});

module.exports = { prisma, pool }
