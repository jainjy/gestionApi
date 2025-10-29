  const express = require("express");
  const router = express.Router();
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  router.get("/", async (req, res) => {
    try {
    const categories = await prisma.category.findMany({
    where: {
      OR: [
        { name: { contains: "art", mode: "insensitive" } },
        { name: { contains: "commerce", mode: "insensitive" } },
        { name: { contains: "peinture", mode: "insensitive" } },
        { name: { contains: "sculptures", mode: "insensitive" } },
        { name: { contains: "artisanat", mode: "insensitive" } },
        { name: { contains: "boutique", mode: "insensitive" } },
      
      ],
    },
    distinct: ["name"], // éviter doublons
    orderBy: { name: "asc" }, // trier par ordre alphabétique
  });


      res.status(200).json(categories || []);
    } catch (err) {
      console.error("Erreur GET /categories :", err);
      res.status(500).json({ message: "Erreur serveur lors du chargement des catégories" });
    }
  });

  module.exports = router;
