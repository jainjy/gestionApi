function mapType(type) {
  switch (type) {
    case "villa": return "villa";
    case "apartment": return "appartement";
    case "studio": return "studio";
    case "land": return "terrain";
    default: return "maison";
  }
}

function mapStatus(status, listingType) {
  if (status === "sold") return "sold";
  if (status === "rented") return "rented";
  return listingType === "rent" ? "available" : "available";
}

module.exports = function mapOliplusToOlimmo(property) {
  return {
    title: property.title,
    description: property.description,
    location: property.city || property.address,
    price: property.price?.toString(),
    surface: property.surface,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,

    type: property.listingType === "rent" ? "location" : "vente",
    status: mapStatus(property.status, property.listingType),

    featured: property.isFeatured ?? false,

    latitude: property.latitude,
    longitude: property.longitude,

    energy_rating: property.energyClass,

    external_source: "oliplus",
    external_id: property.id,
  };
};
