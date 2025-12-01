import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createDigitalisationProfessional() {
  console.log("👤 Création d'un professionnel digitalisation...");

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email: "contact@ariamada.com" },
  });

  if (existingUser) {
    console.log("⚠️  Utilisateur existe déjà:", existingUser.email);
    return;
  }

  // Hacher le mot de passe
  const hashedPassword = await bcrypt.hash("Ariamada2024!", 10);

  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      email: "contact@ariamada.com",
      passwordHash: hashedPassword,
      firstName: "Alexandre",
      lastName: "Dumont",
      companyName: "Ariamada Digital",
      commercialName: "Ariamada",
      phone: "+33 1 23 45 67 89",
      role: "professional",
      userType: "digitalisation",
      address: "123 Avenue des Champs-Élysées",
      city: "Paris",
      zipCode: "75008",
      siret: "12345678901234",
      avatar: "/avatars/professional/digitalisation.jpg",
      status: "active",
    },
  });

  console.log("✅ Utilisateur professionnel créé:", user.email);

  // Récupérer le métier Digitalisation
  const digitalisationMetier = await prisma.metier.findFirst({
    where: { libelle: "Digitalisation" },
  });

  if (digitalisationMetier) {
    // Lier l'utilisateur au métier Digitalisation
    await prisma.utilisateurMetier.create({
      data: {
        userId: user.id,
        metierId: digitalisationMetier.id,
      },
    });
    console.log("✅ Utilisateur lié au métier Digitalisation");
  }

  // Récupérer les services de digitalisation
  const digitalisationServices = await prisma.service.findMany({
    where: { type: "digitalisation" },
    take: 5, // Prendre les 5 premiers services
  });

  // Lier l'utilisateur aux services
  for (const service of digitalisationServices) {
    await prisma.utilisateurService.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        customPrice: service.price ? service.price * 1.1 : undefined, // +10% pour le professionnel
        customDuration: service.duration,
        isAvailable: true,
        description: `Service ${service.libelle} proposé par Ariamada Digital`,
      },
    });
    console.log(`✅ Service "${service.libelle}" ajouté au profil`);
  }

  // Créer les paramètres professionnels
  await prisma.professionalSettings.create({
    data: {
      userId: user.id,
      nomEntreprise: "Ariamada Digital",
      emailContact: "contact@ariamada.com",
      telephone: "+33 1 23 45 67 89",
      adresse: "123 Avenue des Champs-Élysées, 75008 Paris",
      horairesLundi: { start: "09:00", end: "18:00" },
      horairesMardi: { start: "09:00", end: "18:00" },
      horairesMercredi: { start: "09:00", end: "18:00" },
      horairesJeudi: { start: "09:00", end: "18:00" },
      horairesVendredi: { start: "09:00", end: "17:00" },
      delaiReponseEmail: 24,
      delaiReponseTelephone: 2,
      conditionsAnnulation: "Annulation gratuite jusqu'à 48h avant",
      acomptePourcentage: 30,
      montantMinimum: 500,
      conditionsPaiement: "30% à la commande, solde à la livraison",
    },
  });

  console.log("✅ Paramètres professionnels créés");

  console.log("🎉 Professionnel digitalisation créé avec succès !");
  console.log("📧 Email: contact@ariamada.com");
  console.log("🔑 Mot de passe: Ariamada2024!");
}

createDigitalisationProfessional()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
