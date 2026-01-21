const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🌱 Seeding des prestataires FD2L & TARA...");

    const motDePasse = "Pro@oli123";
    const hashMotDePasse = await bcrypt.hash(motDePasse, 10);

    const prestatairesData = [
      {
        // FD2L Formalités
        nom: "FD2L Formalités",
        categorie: "Services administratifs",
        userType: "PRESTATAIRE",
        professionalCategory: "administratif",
        metiers: [
          "Formaliste",
          "Assistant administratif",
          "Conseiller en démarches",
        ],
        email: "contact@formalites974.com",
        phone: "0692 00 00 00",
        websiteUrl: "https://www.formalites974.com/",
        adresse: "La Réunion",
        city: "Saint-Denis",
        zipCode: "97400",
        description:
          "FD2L Formalités accompagne particuliers et professionnels dans toutes leurs démarches administratives : création d'entreprise, formalités légales et accompagnement personnalisé.",
        services: [
          "Création d'entreprise",
          "Formalités administratives",
          "Accompagnement juridique",
        ],
        siren: "901234567",
      },
      {
        // TARA Thérapeute
        nom: "TARA Thérapeute Holistique",
        categorie: "Bien-être",
        userType: "BIEN_ETRE",
        professionalCategory: "bien-etre",
        metiers: [
          "Thérapeute holistique",
          "Praticienne en hypnose",
          "Praticienne bien-être",
        ],
        email: "tarashumking@gmail.com",
        phone: "0692 11 22 33",
        websiteUrl: "https://linktr.ee/tarashukitambour",
        adresse: "La Réunion",
        city: "Saint-Denis",
        zipCode: "97400",
        description:
          "TARA est thérapeute holistique spécialisée en chamanisme, cérémonies du cacao, hypnose spirituelle et symbolique, ainsi qu’en olfacto-thérapie.",
        services: [
          "Thérapie holistique",
          "Cérémonie du cacao",
          "Hypnose spirituelle",
          "Olfacto-thérapie",
        ],
        siren: "912345678",
      },
    ];

    for (const p of prestatairesData) {
      console.log(`\n📋 Traitement: ${p.nom}`);

      const existingUser = await prisma.user.findUnique({
        where: { email: p.email },
      });

      if (existingUser) {
        console.log(`⚠️ Utilisateur déjà existant: ${p.email}`);
        continue;
      }

      // Création / récupération des métiers
      const metiersIds = [];
      for (const libelle of p.metiers) {
        let metier = await prisma.metier.findFirst({
          where: { libelle },
        });

        if (!metier) {
          metier = await prisma.metier.create({
            data: { libelle },
          });
        }
        metiersIds.push(metier.id);
      }

      // Création utilisateur
      const user = await prisma.user.create({
        data: {
          email: p.email,
          passwordHash: hashMotDePasse,
          firstName: p.nom.split(" ")[0],
          lastName: p.nom.split(" ").slice(1).join(" "),
          phone: p.phone,
          role: "professional",
          status: "active",
          companyName: p.nom,
          commercialName: p.nom,
          userType: p.userType,
          professionalCategory: p.professionalCategory,
          city: p.city,
          address: p.adresse,
          zipCode: p.zipCode,
          websiteUrl: p.websiteUrl,
          siren: p.siren,
        },
      });

      console.log(`✅ Compte créé: ${p.nom}`);

      // Liaison métiers
      for (const metierId of metiersIds) {
        await prisma.utilisateurMetier.create({
          data: {
            userId: user.id,
            metierId,
          },
        });
      }

      // Paramètres professionnels
      await prisma.professionalSettings.create({
        data: {
          userId: user.id,
          nomEntreprise: p.nom,
          emailContact: p.email,
          telephone: p.phone,
          adresse: p.adresse,
          delaiReponseEmail: 24,
          delaiReponseTelephone: 2,
          acomptePourcentage: 30,
          conditionsPaiement:
            "Paiement selon prestation convenue avec le client",
        },
      });
    }

    console.log("\n✨ Seeding FD2L & TARA terminé avec succès !");
    console.log(`🔐 Mot de passe commun: ${motDePasse}`);
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
