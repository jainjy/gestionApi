// routes/bienetre.js
const express = require("express");
const router = express.Router();
const { pool } = require("../lib/db");

// GET /api/bienetre
router.get("/", async (req, res) => {
  try {
    //const categories = ["Thérapeute ", "Yoga", "Formateur", "Podcaste"];
    const categories = ["Pilates ", "Yoga", "Cuisine", "Sport","Motivation","Guérison" ,"Spriritualité" ,"Méditation" ];

    const query = `
      SELECT s.id, s.libelle AS title, s.description, s.price, s.images, s.duration, c.name AS category_name
      FROM "Service" s
      JOIN "Category" c ON s."categoryId" = c.id
      WHERE c.name = ANY($1)
      ORDER BY s.id DESC
    `;

    const { rows } = await pool.query(query, [categories]);

    // formater les images (car en JSON)
    const formatted = rows.map(r => ({
      ...r,
      images: Array.isArray(r.images)
        ? r.images
        : JSON.parse(r.images || "[]"),
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Erreur dans /api/bienetre:", error);
    res.status(500).json({ success: false, message: "Erreur serveur", error });
  }
});

module.exports = router;
