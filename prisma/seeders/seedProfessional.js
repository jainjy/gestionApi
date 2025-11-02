// seed-professionals.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcryptjs";
async function main() {
  try {
    console.log("🌱 Seeding professionals with their trades...");

    // Récupération des métiers existants
    const metiers = await prisma.metier.findMany();
    const metiersMap = new Map(metiers.map(m => [m.libelle, m.id]));

    // Données des professionnels à créer
    const professionalsData = [
      {
        email: "electricien.paris@example.com",
        firstName: "Jean",
        lastName: "Dupont",
        companyName: "Électricité Générale Paris",
        metiers: ["Electricien"],
        userType: "PRESTATAIRE",
        city: "Paris"
      },
      {
        email: "plomberie.quick@example.com",
        firstName: "Marie",
        lastName: "Martin",
        companyName: "Plomberie Quick Service",
        metiers: ["Plombier"],
        userType: "PRESTATAIRE",
        city: "Lyon"
      },
      {
        email: "menuiserie.bois@example.com",
        firstName: "Pierre",
        lastName: "Leroy",
        companyName: "Menuiserie Bois Tradition",
        metiers: ["Menuisier Bois et Charpente", "Ébéniste"],
        userType: "PRESTATAIRE",
        city: "Bordeaux"
      },
      {
        email: "peinture.deco@example.com",
        firstName: "Sophie",
        lastName: "Bernard",
        companyName: "Peinture & Décoration",
        metiers: ["Peintre"],
        userType: "PRESTATAIRE",
        city: "Marseille"
      },
      {
        email: "maçonnerie.modern@example.com",
        firstName: "Michel",
        lastName: "Petit",
        companyName: "Maçonnerie Moderne",
        metiers: ["Maçon"],
        userType: "PRESTATAIRE",
        city: "Toulouse"
      },
      {
        email: "architecte.design@example.com",
        firstName: "Thomas",
        lastName: "Moreau",
        companyName: "Architecture & Design Intérieur",
        metiers: ["Architecte", "Architecte Intérieur"],
        userType: "PRESTATAIRE",
        city: "Paris"
      },
      {
        email: "jardin.paysage@example.com",
        firstName: "Alice",
        lastName: "Dubois",
        companyName: "Jardin & Paysage Naturel",
        metiers: ["Paysagiste", "Jardinier"],
        userType: "PRESTATAIRE",
        city: "Nice"
      },
      {
        email: "climatisation.pro@example.com",
        firstName: "David",
        lastName: "Lefebvre",
        companyName: "Climatisation Professionnelle",
        metiers: ["Monteur en Installation de Climatisation", "Frigoriste"],
        userType: "PRESTATAIRE",
        city: "Lille"
      },
      {
        email: "solar.energy@example.com",
        firstName: "Nicolas",
        lastName: "Garcia",
        companyName: "Solar Energy Solutions",
        metiers: ["Monteur en Installation de panneau photovoltaique", "Monnteur en Installation de panneau Solaire"],
        userType: "PRESTATAIRE",
        city: "Montpellier"
      },
      {
        email: "carrelage.expert@example.com",
        firstName: "Patrick",
        lastName: "Roux",
        companyName: "Carrelage Expert France",
        metiers: ["Carreleur", "Dalleur"],
        userType: "PRESTATAIRE",
        city: "Strasbourg"
      },
      {
        email: "charpente.tradition@example.com",
        firstName: "Franck",
        lastName: "Simon",
        companyName: "Charpente Traditionnelle",
        metiers: ["Charpentier bois"],
        userType: "PRESTATAIRE",
        city: "Nantes"
      },
      {
        email: "couvreur.expert@example.com",
        firstName: "Bruno",
        lastName: "Michel",
        companyName: "Couvreur Expert Toiture",
        metiers: ["Couvreur"],
        userType: "PRESTATAIRE",
        city: "Rennes"
      },
      {
        email: "piscine.luxe@example.com",
        firstName: "Catherine",
        lastName: "Laurent",
        companyName: "Piscine Luxe & Design",
        metiers: ["Pisciniste", "Technicien d'équipements Piscine"],
        userType: "PRESTATAIRE",
        city: "Cannes"
      },
      {
        email: "domotique.smart@example.com",
        firstName: "Alexandre",
        lastName: "Mercier",
        companyName: "Domotique Smart Home",
        metiers: ["Domoticien", "Monteur et Installateur en Domotique"],
        userType: "PRESTATAIRE",
        city: "Paris"
      },
      {
        email: "serrurerie.securite@example.com",
        firstName: "Julien",
        lastName: "Blanc",
        companyName: "Serrurerie Sécurité Plus",
        metiers: ["Sérrurier"],
        userType: "PRESTATAIRE",
        city: "Lyon"
      },
      {
        email: "nettoyage.propre@example.com",
        firstName: "Sandrine",
        lastName: "Chevalier",
        companyName: "Nettoyage Propre Service",
        metiers: ["Agent de nettoyage - Propreté", "Nettoyeur"],
        userType: "PRESTATAIRE",
        city: "Bordeaux"
      },
      {
        email: "demolition.express@example.com",
        firstName: "Stéphane",
        lastName: "Fabre",
        companyName: "Démolition Express",
        metiers: ["Démolisseur"],
        userType: "PRESTATAIRE",
        city: "Marseille"
      },
      {
        email: "isolation.thermique@example.com",
        firstName: "Christophe",
        lastName: "Gauthier",
        companyName: "Isolation Thermique Expert",
        metiers: ["Isolateur", "Monteur en Installation d'isolant"],
        userType: "PRESTATAIRE",
        city: "Toulouse"
      },
      {
        email: "vitrerie.modern@example.com",
        firstName: "Laurent",
        lastName: "Barbier",
        companyName: "Vitrerie Modern Glass",
        metiers: ["Vitrier", "Miroitier"],
        userType: "PRESTATAIRE",
        city: "Lille"
      },
      {
        email: "chauffage.confot@example.com",
        firstName: "Marc",
        lastName: "Arnaud",
        companyName: "Chauffage & Confort",
        metiers: ["Monteur de Chaudiere", "Régleur de chaudiere, chauffage"],
        userType: "PRESTATAIRE",
        city: "Nice"
      }
    ];
    const saltRounds = 12;

    // Création des utilisateurs professionnels
    for (const proData of professionalsData) {
      console.log(`\n🔄 Création du professionnel: ${proData.companyName}`);
      const password = await bcrypt.hash("pro123", saltRounds);
      // Création de l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: proData.email,
          firstName: proData.firstName,
          lastName: proData.lastName,
          companyName: proData.companyName,
          userType: proData.userType,
          city: proData.city,
          role: "user",
          status: "active",
          passwordHash: password,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Utilisateur créé: ${user.email}`);

      // Liaison avec les métiers
      for (const metierLibelle of proData.metiers) {
        const metierId = metiersMap.get(metierLibelle);
        
        if (metierId) {
          await prisma.utilisateurMetier.create({
            data: {
              userId: user.id,
              metierId: metierId
            }
          });
          console.log(`   🔗 Lié au métier: ${metierLibelle}`);
        } else {
          console.log(`   ⚠️ Métier non trouvé: ${metierLibelle}`);
        }
      }
    }

    // Mise à jour d'utilisateurs existants (si nécessaire)
    console.log("\n🔄 Mise à jour des utilisateurs existants...");
    
    // Exemple: mettre à jour un utilisateur existant pour lui ajouter un métier
    const existingUsers = await prisma.user.findMany({
      where: {
        userType: "PRESTATAIRE",
        metiers: {
          none: {} // Utilisateurs sans métiers
        }
      },
      take: 5
    });

    const metiersPourUpdates = [
      "Bricoleur",
      "Chef de Chantier",
      "Conducteur de travaux",
      "Diagnostiqueur",
      "Expert Immobilier"
    ];

    for (let i = 0; i < Math.min(existingUsers.length, metiersPourUpdates.length); i++) {
      const user = existingUsers[i];
      const metierLibelle = metiersPourUpdates[i];
      const metierId = metiersMap.get(metierLibelle);

      if (metierId) {
        await prisma.utilisateurMetier.create({
          data: {
            userId: user.id,
            metierId: metierId
          }
        });
        console.log(`✅ ${user.email} lié au métier: ${metierLibelle}`);
      }
    }

    // Création de quelques clients (non professionnels)
    console.log("\n🔄 Création d'utilisateurs clients...");
    
    const clientsData = [
      {
        email: "client.particulier@example.com",
        firstName: "Paul",
        lastName: "Durand",
        userType: "CLIENT",
        city: "Paris"
      },
      {
        email: "investisseur.immobilier@example.com",
        firstName: "Sarah",
        lastName: "Lemoine",
        userType: "CLIENT",
        city: "Lyon"
      },
      {
        email: "proprietaire.bailleur@example.com",
        firstName: "Marc",
        lastName: "Fontaine",
        userType: "LOUEUR",
        city: "Bordeaux"
      },
      {
        email: "vendeur.particulier@example.com",
        firstName: "Julie",
        lastName: "Rousseau",
        userType: "VENDEUR",
        city: "Marseille"
      }
    ];

    for (const clientData of clientsData) {
      await prisma.user.create({
        data: {
          email: clientData.email,
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          userType: clientData.userType,
          city: clientData.city,
          role: "user",
          status: "active",
          passwordHash: "$2a$10$dXJ3SW6G7P.XBLBvanJXu.K9Z9dM7tC8lHlBvLvJ/tC9q9Yz7XJkK",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Client créé: ${clientData.email}`);
    }

    console.log("\n🌿 Seeding des professionnels terminé avec succès !");
    
    // Statistiques
    const totalUsers = await prisma.user.count();
    const usersWithMetiers = await prisma.utilisateurMetier.groupBy({
      by: ['userId'],
      _count: {
        userId: true
      }
    });

    console.log(`📊 Statistiques:`);
    console.log(`   👥 Total utilisateurs: ${totalUsers}`);
    console.log(`   🔧 Utilisateurs avec métiers: ${usersWithMetiers.length}`);

  } catch (error) {
    console.error("❌ Erreur lors du seeding des professionnels:", error);
    throw error;
  }
}

// Script d'exécution
async function runSeeder() {
  try {
    await main();
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution du seeder:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSeeder();