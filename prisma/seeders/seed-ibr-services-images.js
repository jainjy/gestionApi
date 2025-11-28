// seed-ibr-services-images.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding des images pour les services IBR...");

  // Données des catégories et services avec images correspondantes
  const categoriesData = [
    {
      name: "Études préalables & faisabilité",
      services: [
        {
          libelle:
            "Analyse du site et du contexte (PLU, PPR, contraintes ABF, réseaux, accès)",
          images: [
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1G0MRXM_dqVglLp1fEjevDp8QL1xzZ23xgMb7vAZpyZ9P0WDu&s",
          ],
        },
        {
          libelle: "Étude de faisabilité architecturale et technique",
          images: [
            "https://dvtranslation.com/wp-content/uploads/2023/07/architectes-travaillant-sur-une-etude-davant-projet-architectural-1080x675.jpg",
          ],
        },
        {
          libelle: "Estimation du coût et des enveloppes financières",
          images: [
            "https://www.mesquestionsdargent.fr/system/files/styles/cke_media_resize_large/private/2025-08/methode-enveloppe.png?itok=jHJmx8BY",
          ],
        },
        {
          libelle:
            "Études thermiques initiales (besoins, potentiels, contraintes)",
          images: [
            "http://www.cap-energia.com/images/stories/images/schema.jpg",
          ],
        },
        {
          libelle: "Études d'impact environnemental (si applicable)",
          images: [
            "https://www.g-on.fr/app/uploads/2023/10/Sans-titre-3-1024x561.png",
          ],
        },
        {
          libelle:
            "Relevés, diagnostic et état des lieux (structure, réseaux, pathologies)",
          images: [
            "https://image.slidesharecdn.com/pathologieduchantierdebatiment1-240809132504-5e8c498f/75/PATHOLOGIE_DU_CHANTIER_DE_BATIMENT-1-pdf-2-2048.jpg",
          ],
        },
      ],
    },
    {
      name: "Études architecturales",
      services: [
        {
          libelle:
            "Analyse du programme et élaboration des premières intentions",
          images: [
            "https://www.humanperf.com/fr/blog/amelioration-continue/articles/exemple-plan-action/exemple-plan-action-banniere.jpg",
          ],
        },
        {
          libelle:
            "Production des plans : esquisse, APS (avant-projet sommaire), APD (avant-projet détaillé)",
          images: [
            "https://rg-conception.fr/wp-content/uploads/2021/06/VERSION-7-Plans-Avant-Projet-definitif-Projet-de-maison-individuelle-plan-du-rez-de-chausse-suite-parentale-cuisine-ouverte-sur-sejour-vestibule.jpg",
          ],
        },
        {
          libelle: "Vue d'ensemble du projet (plans, coupes, façades, 3D)",
          images: [
            "https://www.s3dengineering.net/wp-content/uploads/2024/07/Vues-en-coupe-pour-plans-de-batiment.png",
          ],
        },
        {
          libelle: "Dossier de demande de permis de construire",
          images: [
            "https://images.prismic.io/pmdc-edito/86c80e50-6d31-4948-b5a6-e53625f7fcf9_Capture+d%E2%80%99e%CC%81cran+2022-02-21+a%CC%80+14.42.44.png?auto=compress,format",
          ],
        },
        {
          libelle: "Plans d'exécution (DCE ou EXE selon ton rôle)",
          images: [
            "https://www.batiscript.com/wp-content/uploads/2025/03/cover_article_-_plan_exe.png",
          ],
        },
      ],
    },
    {
      name: "Études structurelles",
      services: [
        {
          libelle: "Calculs de structures (béton, bois, métal)",
          images: [
            "https://image.jimcdn.com/app/cms/image/transf/none/path/s9ee49fe7f57a5bc4/image/i115c2da027d216f7/version/1451854575/image.jpg",
          ],
        },
        {
          libelle: "Dimensionnement des éléments porteurs",
          images: [
            "https://i.ytimg.com/vi/Pc8a28Zkvg4/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCjF35--775Mrvjb_ilW7R9GN1hOw",
          ],
        },
        {
          libelle:
            "Plans d'armatures, plans de charpente, descentes de charges",
          images: [
            "https://handbook.glulam.org/wp-content/uploads/2019/11/image-210.jpg",
          ],
        },
        {
          libelle: "Études de renforcement structurel (réhabilitation)",
          images: [
            "https://sodiags.fr/wp-content/uploads/2024/02/renforcement-structurel-facade-batiment.webp",
          ],
        },
        {
          libelle: "Modélisation (Robot, Arche, Advance Design, etc.)",
          images: [
            "https://media.springernature.com/lw685/springer-static/image/art%3A10.1007%2Fs12541-025-01226-5/MediaObjects/12541_2025_1226_Fig2_HTML.png",
          ],
        },
      ],
    },
    {
      name: "Économie de la construction",
      services: [
        {
          libelle: "Estimation financière détaillée (DQE, estimatifs par lots)",
          images: ["https://costructor.co/wp-content/uploads/2024/04/24.png"],
        },
        {
          libelle:
            "Rédaction du CCTP (Cahier des Clauses Techniques Particulières)",
          images: [
            "https://images.squarespace-cdn.com/content/v1/6538db8e7b3195658ef5e917/d7c0fb02-f649-41f7-8452-f1cfe1fed22c/CCTP+etapes+de+redaction.png",
          ],
        },
        {
          libelle: "Assistance à la consultation des entreprises (ACT)",
          images: [
            "https://www.newfront.com/_next/image?url=https%3A%2F%2Fimages.ctfassets.net%2Fc3s9zap8g5rq%2F3Y8D3fB7Z5nIdexU2ndR6h%2F9a1f7d1573c0a7ae61a785ec0c11bc46%2FCard_Image_-_401kology_-_3-4-24.jpg%3Fw%3D3600&w=3840&q=75",
          ],
        },
        {
          libelle: "Analyse des offres et mise en concurrence",
          images: [
            "https://marketing-bienveillant.com/wp-content/uploads/2018/09/qui-sont-vos-concurrents-900x506.jpg",
          ],
        },
      ],
    },
    {
      name: "Ingénierie environnementale & performance",
      services: [
        {
          libelle: "Études énergétiques et simulations thermiques (STD, FLJ)",
          images: [
            "https://sequoia-ingenierie.fr/wp-content/uploads/2020/06/SKY-SOPHIA-1.png",
          ],
        },
        {
          libelle:
            "Études d'optimisation environnementale (matériaux biosourcés, ACV)",
          images: [
            "https://www.lab-recherche-environnement.org/wp-content/uploads/acv-et-biosources-fig-5-800x580.jpg",
          ],
        },
      ],
    },
    {
      name: "Suivi de chantier & direction de travaux",
      services: [
        {
          libelle: "Visa des plans des entreprises",
          images: [
            "https://www.desjardins.com/content/dam/images/photos/entreprises/cartes-credit/visa-affaires-f.png",
          ],
        },
        {
          libelle: "Contrôle de l'exécution sur site",
          images: [
            "https://img.freepik.com/vecteurs-premium/controle-execution-taches-norme-qualite-liste-conformite-aux-approbations-performance-qualite_159757-1383.jpg",
          ],
        },
        {
          libelle: "Réunions de chantier & rédaction des comptes-rendus",
          images: [
            "https://geotechniquehse.com/wp-content/uploads/2024/09/En-tete-Compte-Rendu-Chantier.png",
          ],
        },
        {
          libelle: "Suivi des plannings et gestion des aléas",
          images: [
            "https://fr.smartsheet.com/sites/default/files/IC-Risk-Assessment-Matrix-17198_FR.png",
          ],
        },
        {
          libelle: "Réception des travaux & levée des réserves",
          images: [
            "https://www.batiscript.com/wp-content/uploads/2025/03/Cover-PV-de-levee-de-reserves%E2%80%89-1.png",
          ],
        },
      ],
    },
    {
      name: "Spécialités selon BET",
      services: [
        {
          libelle: "Études VRD (voiries, eaux pluviales, assainissement)",
          images: [
            "https://www.aiden01.com/wp-content/uploads/2022/03/AdobeStock_444879891-scaled.jpeg",
          ],
        },
        {
          libelle: "Relevé 2D/3D pour villas/logements existants",
          images: ["https://i.ytimg.com/vi/308PeAeMu6E/maxresdefault.jpg"],
        },
      ],
    },
  ];

  // Mettre à jour les services avec les images
  for (const categoryData of categoriesData) {
    // Vérifier si la catégorie existe
    const category = await prisma.category.findFirst({
      where: {
        name: categoryData.name,
      },
    });

    if (!category) {
      console.log(
        `❌ Catégorie "${categoryData.name}" n'existe pas. Veuillez exécuter le seeder initial d'abord.`
      );
      continue;
    } else {
      console.log(`✅ Catégorie "${categoryData.name}" trouvée`);
    }

    // Mettre à jour les services pour cette catégorie
    for (const serviceData of categoryData.services) {
      // Vérifier si le service existe
      const service = await prisma.service.findFirst({
        where: {
          libelle: serviceData.libelle,
          categoryId: category.id,
        },
      });

      if (!service) {
        console.log(`   ❌ Service "${serviceData.libelle}" n'existe pas.`);
        continue;
      } else {
        console.log(`   ✅ Service "${serviceData.libelle}" trouvé`);
      }

      // Mettre à jour les images du service
      await prisma.service.update({
        where: { id: service.id },
        data: { images: serviceData.images },
      });
      console.log(
        `   📸 Images ajoutées pour le service "${serviceData.libelle}"`
      );
    }
  }

  console.log(
    "🎉 Seeding des images pour les services IBR terminé avec succès!"
  );
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
