// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  // Nettoyer la base existante (optionnel)
  console.log("🧹 Nettoyage des données existantes...");
  await prisma.user.deleteMany();

  // Hasher les mots de passe
  const saltRounds = 12;
  const hashedAdmin123 = await bcrypt.hash("admin123", saltRounds);
  const hashedMod123 = await bcrypt.hash("mod123", saltRounds);
  const hashedPro123 = await bcrypt.hash("pro123", saltRounds);
  const hashedArt123 = await bcrypt.hash("art123", saltRounds);
  const hashedUser123 = await bcrypt.hash("user123", saltRounds);
  const hashedImmo123 = await bcrypt.hash("immo123", saltRounds);
  const hashedService123 = await bcrypt.hash("service123", saltRounds);
  const hashedFurniture123 = await bcrypt.hash("furniture123", saltRounds);
  const hashedWellness123 = await bcrypt.hash("wellness123", saltRounds);

  // Créer les comptes administrateurs
  console.log("👑 Création des comptes administrateurs...");

  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@servo.mg",
      passwordHash: hashedAdmin123,
      firstName: "Super",
      lastName: "Admin",
      phone: "+261 34 12 345 67",
      role: "admin",
      userType: "ADMIN",
      status: "active",
    },
  });

  const moderateur = await prisma.user.create({
    data: {
      email: "moderateur@servo.mg",
      passwordHash: hashedMod123,
      firstName: "Modérateur",
      lastName: "SERVO",
      phone: "+261 34 12 345 68",
      role: "admin",
      userType: "ADMIN",
      status: "active",
    },
  });

  // Créer les comptes professionnels IMMOBILIER (Pro Immobilier Complet)
  console.log("🏢 Création des comptes professionnels immobilier...");

  const agenceImmo = await prisma.user.create({
    data: {
      email: "agence@immo.mg",
      passwordHash: hashedImmo123,
      firstName: "Pierre",
      lastName: "Rakoto",
      phone: "+261 34 12 345 72",
      role: "professional",
      userType: "VENDEUR",
      status: "active",
      companyName: "ImmoPro Madagascar",
      commercialName: "ImmoPro",
      siret: "12345678901234",
      address: "Lot IV 123 Bis",
      zipCode: "101",
      city: "Antananarivo",
      demandType: "agence immobilier",
    },
  });

  const syndicImmo = await prisma.user.create({
    data: {
      email: "syndic@immo.mg",
      passwordHash: hashedImmo123,
      firstName: "Sophie",
      lastName: "Randria",
      phone: "+261 34 12 345 73",
      role: "professional",
      userType: "LOUEUR",
      status: "active",
      companyName: "Syndic Professionnel",
      commercialName: "SyndicPro",
      siret: "56789012345678",
      address: "Av de l Indépendance",
      zipCode: "101",
      city: "Antananarivo",
      demandType: "syndicat",
    },
  });

  // Créer les comptes PRESTATAIRES DE SERVICES (Artisans)
  console.log("🔧 Création des comptes prestataires de services...");

  const artisanPlombier = await prisma.user.create({
    data: {
      email: "plombier@service.mg",
      passwordHash: hashedService123,
      firstName: "Jean",
      lastName: "Rabe",
      phone: "+261 34 12 345 74",
      role: "professional",
      userType: "PRESTATAIRE",
      status: "active",
      companyName: "Plomberie Express",
      commercialName: "Plomberie Rapide",
      siret: "90123456789012",
      address: "Rue des Artisans",
      zipCode: "101",
      city: "Antananarivo",
    },
  });

  const artisanElectricien = await prisma.user.create({
    data: {
      email: "electricien@service.mg",
      passwordHash: hashedService123,
      firstName: "Paul",
      lastName: "Andria",
      phone: "+261 34 12 345 75",
      role: "professional",
      userType: "PRESTATAIRE",
      status: "active",
      companyName: "Électricité Générale",
      commercialName: "ElecPro",
      siret: "34567890123456",
      address: "Zone Industrielle",
      zipCode: "101",
      city: "Antananarivo",
    },
  });

  // Créer les comptes COMMERÇANTS MEUBLES (Espace Ameublement)
  console.log("🛋️ Création des comptes commerçants meubles...");

  const meubleDecor = await prisma.user.create({
    data: {
      email: "meuble@deco.mg",
      passwordHash: hashedFurniture123,
      firstName: "Marie",
      lastName: "Rasoa",
      phone: "+261 34 12 345 76",
      role: "professional",
      userType: "VENDEUR",
      status: "active",
      companyName: "Meubles & Décoration",
      commercialName: "Maison Déco",
      siret: "78901234567890",
      address: "Route des Meubles",
      zipCode: "101",
      city: "Antananarivo",
    },
  });

  const artisanMenuisier = await prisma.user.create({
    data: {
      email: "menuisier@meuble.mg",
      passwordHash: hashedFurniture123,
      firstName: "Thomas",
      lastName: "Rajaona",
      phone: "+261 34 12 345 77",
      role: "professional",
      userType: "VENDEUR",
      status: "active",
      companyName: "Menuiserie Traditionnelle",
      commercialName: "Bois Naturel",
      siret: "23456789012345",
      address: "Quartier Artisanal",
      zipCode: "101",
      city: "Antananarivo",
    },
  });

  // Créer les comptes BIEN-ÊTRE
  console.log("💆 Création des comptes bien-être...");

  const estheticienne = await prisma.user.create({
    data: {
      email: "beaute@wellness.mg",
      passwordHash: hashedWellness123,
      firstName: "Sarah",
      lastName: "Nirina",
      phone: "+261 34 12 345 78",
      role: "professional",
      userType: "PRESTATAIRE",
      status: "active",
      companyName: "Institut de Beauté Sarah",
      commercialName: "Beauté Naturelle",
      siret: "67890123456789",
      address: "Av de la Beauté",
      zipCode: "101",
      city: "Antananarivo",
    },
  });

  const massageTherapist = await prisma.user.create({
    data: {
      email: "massage@wellness.mg",
      passwordHash: hashedWellness123,
      firstName: "David",
      lastName: "Rakotondrabe",
      phone: "+261 34 12 345 79",
      role: "professional",
      userType: "PRESTATAIRE",
      status: "active",
      companyName: "Centre de Massage Traditionnel",
      commercialName: "Massage Malagasy",
      siret: "01234567890123",
      address: "Rue du Bien-être",
      zipCode: "101",
      city: "Antananarivo",
    },
  });

  // Anciens comptes professionnels (gardés pour compatibilité)
  console.log("💼 Création des anciens comptes professionnels...");

  const proUser = await prisma.user.create({
    data: {
      email: "pro@servo.mg",
      passwordHash: hashedPro123,
      firstName: "Jean",
      lastName: "Dupont",
      phone: "+261 34 12 345 69",
      role: "professional",
      userType: "VENDEUR",
      status: "active",
      companyName: "Dupont Immobilier",
    },
  });

  const artisanUser = await prisma.user.create({
    data: {
      email: "artisan@servo.mg",
      passwordHash: hashedArt123,
      firstName: "Marie",
      lastName: "Martin",
      phone: "+261 34 12 345 70",
      role: "professional",
      userType: "PRESTATAIRE",
      status: "active",
      companyName: "Martin Services",
    },
  });


  // Créer le compte utilisateur standard
  console.log("👤 Création du compte utilisateur...");

  await prisma.user.create({
    data: {
      email: "user@servo.mg",
      passwordHash: hashedUser123,
      firstName: "Alice",
      lastName: "Durand",
      phone: "+261 34 12 345 71",
      role: "user",
      userType: "CLIENT",
      status: "active",
    },
  });

  console.log("✅ Seeding terminé avec succès!");
  console.log("\n📋 Comptes créés:");
  console.log("===================");
  console.log("👑 Administrateurs:");
  console.log("   superadmin@servo.mg / admin123");
  console.log("   moderateur@servo.mg / mod123");

  console.log("\n🏢 Professionnels Immobilier:");
  console.log("   agence@immo.mg / immo123");
  console.log("   syndic@immo.mg / immo123");

  console.log("\n🔧 Prestataires de Services:");
  console.log("   plombier@service.mg / service123");
  console.log("   electricien@service.mg / service123");

  console.log("\n🛋️ Commerçants Meubles:");
  console.log("   meuble@deco.mg / furniture123");
  console.log("   menuisier@meuble.mg / furniture123");

  console.log("\n💆 Professionnels Bien-être:");
  console.log("   beaute@wellness.mg / wellness123");
  console.log("   massage@wellness.mg / wellness123");

  console.log("\n💼 Anciens Professionnels:");
  console.log("   pro@servo.mg / pro123");
  console.log("   artisan@servo.mg / art123");

  console.log("\n👤 Utilisateur:");
  console.log("   user@servo.mg / user123");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
