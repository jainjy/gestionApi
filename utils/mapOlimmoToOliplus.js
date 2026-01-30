module.exports = function mapOlimmoToOliplus(olimmo,ownerId) {
  return {
    title: olimmo.title,
    description: olimmo.description,
    type: olimmo.type,
    status: olimmo.status || "pending",

    price: olimmo.price ? parseFloat(olimmo.price) : null,
    surface: olimmo.surface ? parseInt(olimmo.surface) : null,

    bedrooms: olimmo.bedrooms,
    bathrooms: olimmo.bathrooms,

    city: olimmo.location || "Inconnue",
    address: olimmo.location || null,

    latitude: olimmo.latitude ? Number(olimmo.latitude) : null,
    longitude: olimmo.longitude ? Number(olimmo.longitude) : null,

    images: olimmo.image_url ? [olimmo.image_url] : [],
    features: [],

    isFeatured: olimmo.featured ?? false,
    isActive: true,

    energyClass: olimmo.energy_rating,

    listingType:
      olimmo.status?.toLowerCase().includes("louer") ? "rent" : "sale",

    ownerId:ownerId,

    externalSource: "olimmo",
    externalId: olimmo.id,

    publishedAt: olimmo.created_at,
  };
};
