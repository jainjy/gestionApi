// test-db.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL ? "✅ Présente" : "❌ Manquante");

const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log("✅ Connexion à la base de données réussie !");
    
    const count = await prisma.demande.count();
    console.log(`📊 Nombre de demandes: ${count}`);
    
  } catch (error) {
    console.error("❌ Erreur de connexion:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();