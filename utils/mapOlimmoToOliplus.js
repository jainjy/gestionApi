function cleanPrice(price) {
  if (!price) return null;
  return parseFloat(price.replace(/\s/g, "").replace(",", "."));
}

function mapStatus(olimmo,ownerId) {
  if (olimmo.status === "available") {
    return olimmo.type === "location" ? "for_rent" : "for_sale";
  }
  if (olimmo.status === "sold") return "sold";
  if (olimmo.status === "rented") return "rented";
  return "pending";
}

function mapType(olimmo) {
  const title = (olimmo.title || "").toLowerCase();

  if (title.includes("terrain") || title.includes("parcelle")) return "land";
  if (title.includes("villa")) return "villa";
  if (title.includes("studio")) return "studio";
  if (title.includes("appartement")) return "apartment";

  return "house";
}
module.exports = function mapOlimmoToOliplus(olimmo, ownerId) {
  return {
    title: olimmo.title,
    description: olimmo.description,

    type: mapType(olimmo),
    status: mapStatus(olimmo),

    price: cleanPrice(olimmo.price),
    surface: olimmo.surface ? parseInt(olimmo.surface) : null,

    bedrooms: olimmo.bedrooms || 0,
    bathrooms: olimmo.bathrooms || 0,

    city: olimmo.location || "Inconnue",
    address: olimmo.location || null,

    latitude: olimmo.latitude ? Number(olimmo.latitude) : null,
    longitude: olimmo.longitude ? Number(olimmo.longitude) : null,

    // ✅ ICI LA CORRECTION
    images: Array.isArray(olimmo.images) ? olimmo.images : [],

    features: [],

    isFeatured: olimmo.featured ?? false,
    isActive: true,

    energyClass: olimmo.energy_rating || null,

    listingType: olimmo.type === "location" ? "rent" : "sale",

    ownerId,
    externalSource: "olimmo",
    externalId: olimmo.id,

    publishedAt: olimmo.created_at,
    updatedAt: olimmo.updated_at ? new Date(olimmo.updated_at) : new Date(),
  };
};
