// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {

  // Hasher les mots de passe
  const saltRounds = 12;
  const hashedAdmin123 = await bcrypt.hash("admin123", saltRounds);
  const hashedPro123 = await bcrypt.hash("pro123", saltRounds);
  const hashedArt123 = await bcrypt.hash("art123", saltRounds);
  const hashedUser123 = await bcrypt.hash("user123", saltRounds);
  const hashedImmo123 = await bcrypt.hash("immo123", saltRounds);
  const hashedService123 = await bcrypt.hash("service123", saltRounds);
  const hashedFurniture123 = await bcrypt.hash("furniture123", saltRounds);
  const hashedWellness123 = await bcrypt.hash("wellness123", saltRounds);
  const userPro=await prisma.user.findMany({
    where: { role: "professional" },
  });
  for (const pro of userPro) {
    await prisma.user.update({
      where: { id: pro.id },
      data: { passwordHash: hashedPro123 },
    });
    console.log(pro.email);
  }
  console.log("✅ Seeding terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
