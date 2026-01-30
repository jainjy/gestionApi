const express = require("express");
const router = express.Router();
const supabaseolimmo = require("../lib/supabaseClient");

/**
 * 🔁 GET /api/sync/olimmo/properties
 * Récupère toutes les propriétés depuis OLIMMO (Supabase)
 */
router.get("/olimmo/properties", async (req, res) => {
  try {
    const { data, error } = await supabaseolimmo
      .from("properties")
      .select(`
        id,
        title,
        location,
        price,
        type,
        surface,
        bedrooms,
        bathrooms,
        images,
        featured,
        image_url,
        description,
        energy_rating,
        latitude,
        longitude,
        status,
        created_at,
        updated_at,
        videos
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({
        success: false,
        error: "Erreur récupération propriétés OLIMMO",
      });
    }

    res.json({
      success: true,
      source: "OLIMMO",
      count: data.length,
      properties: data,
    });
  } catch (err) {
    console.error("❌ Erreur serveur:", err);
    res.status(500).json({
      success: false,
      error: "Erreur interne serveur",
    });
  }
});

module.exports = router;
