// // prisma/seedNewAdmin.js
// const { PrismaClient } = require("@prisma/client");
// const bcrypt = require("bcryptjs");

// const prisma = new PrismaClient();

// async function main() {
//   console.log("🌱 Début du seeding du nouveau compte admin...");

//   // Hasher le mot de passe
//   const saltRounds = 12;
//   const hashedAdminPassword = await bcrypt.hash("admin@oli26", saltRounds);

//   // Créer le compte admin
//   const newAdmin = await prisma.user.create({
//     data: {
//       email: "admin@oliplus.re",
//       passwordHash: hashedAdminPassword,
//       firstName: "Admin",
//       lastName: "OliPlus",
//       phone: "+261 34 12 345 80",
//       role: "admin",
//       userType: "ADMIN",
//       status: "active",
//     },
//   });

//   console.log("✅ Nouveau compte admin créé avec succès !");
//   console.log("📋 Compte : admin@oliplus.re / admin123");
// }

// main()
//   .catch((e) => {
//     console.error("❌ Erreur lors du seeding:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

//prisma/seedNewAdmin.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding du nouveau compte admin...");

  // Hasher le mot de passe
  const saltRounds = 12;
  const hashedAdminPassword = await bcrypt.hash("direction@oli26", saltRounds);

  // Créer le compte admin
  const newAdmin = await prisma.user.create({
    data: {
      email: "direction@oliplus.re",
      passwordHash: hashedAdminPassword,
      firstName: "Admin",
      lastName: "OliPlus",
      phone: "+262 692 66 77 55",
      role: "admin",
      userType: "ADMIN",
      status: "active",
      avatar:
        "https://wvrxayklhpbquxsluzve.supabase.co/storage/v1/object/public/blog-images/blog-images/1768826569336-mey1yjm3q4.png",
    },
  });

  console.log("✅ Nouveau compte admin créé avec succès !");
  console.log("📋 Compte : direction@oliplus.re / direction123");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

