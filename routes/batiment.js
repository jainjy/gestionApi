const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * GET /api/batiment
 * Récupère les services selon les sections actives (non commentées dans React)
 * Exemple : Rénovation & Chantiers, Matériaux & Viabilisations, Division Parcellaire
 */
// router.get("/", async (req, res) => {
//   try {
//     // ⚙️ Les sections actives de ton composant React
//     const sections = [
//       "Rénovation & Chantiers",
//       "Matériaux & Viabilisations",
//       "Division Parcellaire",
//     ];

//     // 📦 Tableau pour stocker les résultats par catégorie
//     const resultats = [];

//     // 🔁 Boucle sur chaque section
//     for (const sectionName of sections) {
//       const category = await prisma.category.findFirst({
//         where: {
//           name: {
//             contains: sectionName,
//             mode: "insensitive", // insensible à la casse
//           },
//         },
//         include: {
//           services: {
//             include: {
//               metiers: {
//                 include: { metier: true },
//               },
//               Review: {
//                 include: {
//                   user: {
//                     select: {
//                       firstName: true,
//                       lastName: true,
//                       avatar: true,
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       });

//       if (category) {
//         resultats.push({
//           category: category.name,
//           services: category.services.map((service) => ({
//             id: service.id,
//             title: service.libelle,
//             description: service.description,
//             price: service.price ? `${service.price}€` : "Sur devis",
//             images: service.images,
//             duration: service.duration,
//             metiers: service.metiers.map((m) => m.metier?.name || null),
//             reviews: service.Review.map((r) => ({
//               note: r.note,
//               commentaire: r.commentaire,
//               user: r.user,
//             })),
//           })),
//         });
//       }
//     }

//     // 🧾 Vérifie s’il y a des résultats
//     if (resultats.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "Aucune catégorie active n’a de service." });
//     }

//     res.status(200).json({
//       success: true,
//       totalCategories: resultats.length,
//       data: resultats,
//     });
//   } catch (error) {
//     console.error("❌ Erreur lors de la récupération des services:", error);
//     res.status(500).json({
//       error: "Erreur interne lors de la récupération des services.",
//     });
//   }

router.get("/", async (req, res) => {
  try {
    // 🟦 Nom de la catégorie à récupérer
    const CATEGORY_NAME = "Matériaux de Construction";

    // 🔍 Trouver la catégorie + tous les services associés
    const category = await prisma.category.findFirst({
      where: {
        name: {
          equals: CATEGORY_NAME,
          mode: "insensitive",
        },
      },
      include: {
        services: {
          include: {
            metiers: {
              include: { metier: true },
            },
            Review: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // ❌ Aucun résultat trouvé
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Aucune catégorie trouvée avec le nom : ${CATEGORY_NAME}`,
      });
    }

    // 🟩 Structure finale propre
    const result = {
      category: category.name,
      services: category.services.map((service) => ({
        id: service.id,
        title: service.libelle,
        description: service.description,
        price: service.price ? `${service.price}€` : "Sur devis",
        images: service.images,
        duration: service.duration,
        metiers: service.metiers.map((m) => m.metier?.name || null),
        reviews: service.Review.map((r) => ({
          note: r.note,
          commentaire: r.commentaire,
          user: r.user,
        })),
      })),
    };

    // 🔥 Réponse envoyée
    res.status(200).json({
      success: true,
      data: [result], // tableau pour rester compatible avec ton front
      totalCategories: 1,
    });

  } catch (error) {
    console.error("❌ Erreur récupération services :", error);
    res.status(500).json({
      success: false,
      error: "Erreur interne lors de la récupération des services.",
    });
  }
});

module.exports = router;
