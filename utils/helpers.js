// src/utils/helpers.js

// Fonction pour parser les données des requêtes
const parseRequestData = (data, schema = 'event') => {
  const parsedData = { ...data };
  
  // Liste des champs qui peuvent être JSON
  const jsonFields = {
    event: ['tags', 'images', 'highlights', 'targetAudience', 'includes', 'notIncludes'],
    discovery: [
      'tags', 'images', 'highlights', 'bestSeason', 'bestTime', 
      'equipment', 'includes', 'notIncludes', 'languages',
      'coordinates', 'includedServices', 'requirements', 'availableDates'
    ]
  };

  const fields = jsonFields[schema] || [];
  
  fields.forEach(field => {
    if (parsedData[field] !== undefined && parsedData[field] !== null) {
      if (typeof parsedData[field] === 'string') {
        try {
          parsedData[field] = JSON.parse(parsedData[field]);
        } catch (error) {
          // Si ce n'est pas du JSON valide, traiter comme une chaîne simple
          console.warn(`Impossible de parser le champ ${field} comme JSON:`, parsedData[field]);
        }
      }
    }
  });

  return parsedData;
};

// Fonction pour valider les coordonnées
const validateCoordinates = (coordinates) => {
  if (!coordinates) return null;
  
  if (typeof coordinates === 'string') {
    try {
      coordinates = JSON.parse(coordinates);
    } catch {
      // Essayer de parser comme "lat,lng"
      const parts = coordinates.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
      return null;
    }
  }

  if (typeof coordinates === 'object' && coordinates !== null) {
    const lat = parseFloat(coordinates.lat);
    const lng = parseFloat(coordinates.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  return null;
};

module.exports = {
  parseRequestData,
  validateCoordinates
};