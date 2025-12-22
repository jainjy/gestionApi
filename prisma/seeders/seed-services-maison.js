const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🌱 Ajout des services maison sans supprimer les données existantes...");

    // Récupérer la catégorie "Services Maison" ou la créer
    let category = await prisma.category.findFirst({
      where: { name: "Services Maison" }
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: "Services Maison" }
      });
      console.log(`✅ Catégorie créée: ${category.name}`);
    } else {
      console.log(`📝 Catégorie existante: ${category.name}`);
    }

    // Liste des métiers à créer ou récupérer
    const metierNames = [
      "Agent de Ménage",
      "Jardinier Paysagiste", 
      "Technicien Piscine",
      "Technicien en Sécurité",
      "Nettoyeur Spécialisé"
    ];

    const metiersMap = {};

    // Récupérer ou créer les métiers
    for (const metierName of metierNames) {
      let metier = await prisma.metier.findFirst({
        where: { libelle: metierName }
      });

      if (!metier) {
        metier = await prisma.metier.create({
          data: { libelle: metierName }
        });
        console.log(`✅ Métier créé: ${metier.libelle}`);
      } else {
        console.log(`📝 Métier existant: ${metier.libelle}`);
      }
      
      metiersMap[metierName] = metier;
    }

    // Services à créer
    const services = [
      {
        libelle: "Ménage Complet 3h",
        description: "Nettoyage approfondi de toute la maison : sols, surfaces, sanitaires, vitres et poussières avec produits écologiques.",
        images: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        price: 65,
        duration: 180,
        metier: "Agent de Ménage",
        tags: ["ménage", "nettoyage", "complet", "3h", "écologique"]
      },
      {
        libelle: "Grand Ménage Printemps",
        description: "Nettoyage de printemps complet incluant placards, rideaux, moquettes et zones difficiles d'accès.",
        images: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        price: 150,
        duration: 360,
        metier: "Agent de Ménage",
        tags: ["grand", "ménage", "printemps", "complet", "profond"]
      },
      {
        libelle: "Tonte de Pelouse Mensuelle",
        description: "Abonnement mensuel de tonte avec évacuation des déchets verts et finition soignée des bordures.",
        images: ["https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        price: 40,
        duration: 60,
        metier: "Jardinier Paysagiste",
        tags: ["tonte", "pelouse", "mensuel", "jardin", "entretien"]
      },
      {
        libelle: "Taille Haies & Arbustes",
        description: "Taille professionnelle des haies et arbustes avec mise en forme et évacuation des déchets.",
        images: ["https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        price: 75,
        duration: 120,
        metier: "Jardinier Paysagiste",
        tags: ["taille", "haies", "arbustes", "jardin", "élagage"]
      },
      {
        libelle: "Entretien Piscine Hebdo",
        description: "Nettoyage hebdomadaire complet : skimmer, ligne d'eau, fond, traitement chimique et vérification filtration.",
        images: ["https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        price: 85,
        duration: 120,
        metier: "Technicien Piscine",
        tags: ["piscine", "entretien", "hebdomadaire", "nettoyage", "traitement"]
      },
      {
        libelle: "Hivernage Piscine",
        description: "Préparation complète pour l'hiver avec traitement, bâchage et protection du système de filtration.",
        images: ["https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        price: 200,
        duration: 240,
        metier: "Technicien Piscine",
        tags: ["hivernage", "piscine", "hiver", "protection", "traitement"]
      },
      {
        libelle: "Installation Alarme Complète",
        description: "Système d'alarme sans fil avec capteurs portes/fenêtres, sirène 110dB et connexion application mobile.",
        images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        price: 350,
        duration: 240,
        metier: "Technicien en Sécurité",
        tags: ["alarme", "sécurité", "installation", "sans-fil", "capteurs"]
      },
      {
        libelle: "Kit 4 Caméras Surveillance",
        description: "Installation de 4 caméras HD extérieures avec vision nocturne, détection mouvement et stockage cloud.",
        images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        price: 600,
        duration: 360,
        metier: "Technicien en Sécurité",
        tags: ["caméras", "surveillance", "vidéo", "sécurité", "HD"]
      },
      {
        libelle: "Nettoyage Après Travaux",
        description: "Nettoyage intensif après rénovation : poussière de plâtre, résidus, finition impeccable.",
        images: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        price: 180,
        duration: 300,
        metier: "Nettoyeur Spécialisé",
        tags: ["nettoyage", "travaux", "après-construction", "poussière", "finition"]
      }
    ];

    console.log(`🛠️  Création des ${services.length} services...`);
    
    for (const serviceData of services) {
      // Vérifier si le service existe déjà
      const existingService = await prisma.service.findFirst({
        where: { libelle: serviceData.libelle }
      });

      if (!existingService) {
        // Créer le service
        const service = await prisma.service.create({
          data: {
            libelle: serviceData.libelle,
            description: serviceData.description,
            images: serviceData.images,
            price: serviceData.price,
            duration: serviceData.duration,
            categoryId: category.id,
            type: "general",
            isActive: true,
            tags: serviceData.tags
          }
        });

        // Créer la relation avec le métier
        if (metiersMap[serviceData.metier]) {
          await prisma.metierService.create({
            data: {
              metierId: metiersMap[serviceData.metier].id,
              serviceId: service.id
            }
          });
        }

        console.log(`✅ Service créé: ${service.libelle} (${serviceData.metier})`);
      } else {
        console.log(`⚠️  Service déjà existant: ${serviceData.libelle}`);
      }
    }

    console.log("🎉 Seeding terminé avec succès !");

  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });