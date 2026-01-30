const express = require("express");
const router = express.Router();

const supabaseolimmo = require("../lib/supabaseClient");
const mapOlimmoToOliplus = require("../utils/mapOlimmoToOliplus");
const { prisma } = require("../lib/db");

/**
 * 🔁 POST /api/synchronisation/olimmo-to-oliplus
 */
router.post("/olimmo-to-oliplus", async (req, res) => {
  try {
    const owner=await prisma.user.findFirst({
      where:{email:"olimmoreunion@gmail.com"}
    })
    
    //1️⃣ récupérer OLIMMO
    const { data: olimmoProperties, error } = await supabaseolimmo
      .from("properties")
      .select("*");

    if (error) throw error;

    let created = 0;
    let skipped = 0;

    // 2️⃣ boucle de synchronisation
    for (const olimmo of olimmoProperties) {
      const exists = await prisma.property.findUnique({
        where: { externalId: olimmo.id },
      });

      if (exists) {
        skipped++;
        continue;
      }

      const mapped = mapOlimmoToOliplus(olimmo,owner.id);

      await prisma.property.create({ data: mapped });
      created++;
    }

    res.json({
      success: true,
      source: "OLIMMO → OLIPLUS",
      totalFetched: olimmoProperties.length,
      created,
      skipped,
    });
  } catch (err) {
    console.error("❌ SYNC ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Erreur synchronisation OLIMMO → OLIPLUS",
    });
  }
});

/**
 * 🔁 GET /api/synchronisation/olimmo
 * Récupère toutes les propriétés depuis OLIMMO (Supabase)
 */
router.get("/olimmo", async (req, res) => {
  try {
    const { data, error } = await supabaseolimmo
      .from("properties")
      .select(`
        id,
        title,
        type,
        status

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
