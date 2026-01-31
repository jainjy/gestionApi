const express = require("express");
const router = express.Router();

const supabaseolimmo = require("../lib/supabaseClient");
const mapOlimmoToOliplus = require("../utils/mapOlimmoToOliplus");
const { prisma } = require("../lib/db");
const mapOliplusToOlimmo = require("../utils/mapOliplusToOlimmo");

/**
 * 🔁 POST /api/synchronisation/olimmo-to-oliplus
 */
router.post("/olimmo-to-oliplus", async (req, res) => {
  try {

     const owner=await prisma.user.findFirst({
      where:{email:"olimmoreunion@gmail.com"}
    })
    const { data: olimmoProperties, error } = await supabaseolimmo
      .from("properties")
      .select("*");

    if (error) throw error;

    let created = 0;
    let skipped = 0;

    for (const olimmo of olimmoProperties) {
      // 🔹 Récupération des images OLIMMO
      const { data: images, error: imagesError } = await supabaseolimmo
        .from("property_images")
        .select("image_url")
        .eq("property_id", olimmo.id)
        .order("image_order", { ascending: true });

      if (imagesError) {
        console.error("❌ Images error:", imagesError);
      }

      // 🔹 Injection des images dans l’objet olimmo
      olimmo.images = images ? images.map(img => img.image_url) : [];
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
      fetched: olimmoProperties.length,
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
      .from("properties_duplicate")
      .select(`
        id,
        title,
        type,
        status,
        external_source,
        external_id

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

router.put("/oliplus-to-olimmo/:id", async (req, res) => {
  try {
    const propertyId = req.params.id;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return res.status(404).json({ error: "Propriété introuvable" });
    }

    const mapped = mapOliplusToOlimmo(property);

    const { error } = await supabaseolimmo
      .from("properties_duplicate")
      .update(mapped)
      .eq("external_id", property.id)
      .eq("external_source", "oliplus");

    if (error) throw error;

    res.json({
      success: true,
      action: "updated",
      propertyId,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur update OLIMMO" });
  }
});

router.post("/olimmo-to-oliplus/update", async (req, res) => {
  try {
    const owner = await prisma.user.findFirst({
      where: { email: "olimmoreunion@gmail.com" },
    });

    const { data: olimmoProperties, error } = await supabaseolimmo
      .from("properties_duplicate")
      .select("*");

    if (error) throw error;

    let updated = 0;
    let created = 0;
    let skipped = 0;

    for (const olimmo of olimmoProperties) {
      const existing = await prisma.property.findFirst({
        where: {
          externalSource: "olimmo",
          externalId: String(olimmo.id),
        },
      });

      const mapped = mapOlimmoToOliplus(olimmo, owner.id);

      if (existing) {
        // 🕒 Comparaison des dates
        const olimmoUpdated = new Date(olimmo.updated_at);
        const oliplusUpdated = existing.updatedAt;

        if (olimmoUpdated <= oliplusUpdated) {
          skipped++;
          continue;
        }

        await prisma.property.update({
          where: { id: existing.id },
          data: mapped,
        });

        updated++;
      } else {
        await prisma.property.create({ data: mapped });
        created++;
      }
    }

    res.json({
      success: true,
      source: "OLIMMO → OLIPLUS",
      created,
      updated,
      skipped,
    });
  } catch (err) {
    console.error("❌ SYNC UPDATE ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Erreur update OLIMMO → OLIPLUS",
    });
  }
});

/**
 * 🔁 POST /api/synchronisation/oliplus-to-olimmo
 * body: { propertyIds?: number[] }
 */
router.post("/oliplus-to-olimmo", async (req, res) => {
  try {
    const { propertyIds } = req.body;

    // 🔹 1. Récupérer propriétés OLIPLUS
    const properties = await prisma.property.findMany({
      where: propertyIds ? { id: { in: propertyIds } } : {},
    });

    let created = 0;
    let skipped = 0;

    for (const property of properties) {
  // Vérifie si la propriété existe déjà dans OLIMMO
  const { data: exists } = await supabaseolimmo
    .from("properties_duplicate")
    .select("id")
    .eq("external_id", property.id)
    .maybeSingle();

  if (exists) {
    skipped++;
    continue;
  }

  // Mapper la propriété
  const olimmoProperty = mapOliplusToOlimmo(property);

  // Créer la propriété dans OLIMMO
  const { data: createdProperty, error } = await supabaseolimmo
    .from("properties_duplicate")
    .insert(olimmoProperty)
    .select()
    .single();

  if (error) throw error;

  // Créer les images uniquement si elles n'existent pas déjà
  if (property.images?.length) {
    const imagesPayload = property.images.map((url, index) => ({
      property_id: createdProperty.id,
      image_url: url,
      image_order: index + 1,
    }));

    await supabaseolimmo
      .from("property_images_duplicate")
      .upsert(imagesPayload, { onConflict: ["property_id", "image_order"] });
  }

  created++;
}


    res.json({
      success: true,
      source: "OLIPLUS → OLIMMO",
      total: properties.length,
      created,
      skipped,
    });

  } catch (err) {
    console.error("❌ SYNC ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Erreur synchronisation OLIPLUS → OLIMMO",
    });
  }
});

module.exports = router;
