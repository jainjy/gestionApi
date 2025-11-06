// routes/estimation.js
const express = require('express');
const router = express.Router();
require('dotenv').config();

// ======================================
// ⚙️ Initialisation Gemini
// ======================================
let geminiAvailable = false;
let selectedModel = 'gemini-2.0-flash';

async function initializeGemini() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI_API_KEY manquante');
      geminiAvailable = false;
      return;
    }
    geminiAvailable = true;
    console.log('✅ Gemini initialisé');
  } catch (error) {
    console.error('❌ Erreur configuration Gemini:', error.message);
    geminiAvailable = false;
  }
}

// ======================================
// 🏠 Fonction : Construire le prompt MONDIAL
// ======================================
function buildPrompt(data) {
  const propertyTypeLabels = {
    apartment: 'Appartement',
    house: 'Maison', 
    villa: 'Villa',
    studio: 'Studio',
    loft: 'Loft',
    duplex: 'Duplex',
    commercial: 'Local Commercial'
  };

  const conditionLabels = {
    excellent: 'Excellent état (neuf ou rénové récemment)',
    good: 'Bon état (bien entretenu, quelques retouches)',
    average: 'État moyen (habitable mais besoin de travaux)',
    needs_renovation: 'À rénover (travaux importants nécessaires)'
  };

  const featuresList = Object.entries(data.features || {})
    .filter(([_, value]) => value)
    .map(([key]) => {
      const featureNames = {
        balcony: 'Balcon',
        terrace: 'Terrasse', 
        garden: 'Jardin',
        parking: 'Parking',
        elevator: 'Ascenseur',
        pool: 'Piscine',
        basement: 'Cave'
      };
      return featureNames[key] || key;
    })
    .join(', ') || 'Aucun équipement particulier';

  const locationInfo = data.location ? 
    `${data.location.city}${data.location.region ? ', ' + data.location.region : ''}, ${data.location.country}` :
    'Localisation non spécifiée';

  return `ESTIMATION IMMOBILIÈRE INTERNATIONALE

**BIEN À ESTIMER:**
- Type: ${propertyTypeLabels[data.propertyType] || data.propertyType}
- Surface: ${data.surface} m²
- Pièces: ${data.rooms || 'Non spécifié'}
- Chambres: ${data.bedrooms || 'Non spécifié'}
- Salles de bain: ${data.bathrooms || 'Non spécifié'}
- État: ${conditionLabels[data.condition] || data.condition}
- Localisation: ${locationInfo}
- Pays: ${data.location?.country || 'Non spécifié'}
- Ville: ${data.location?.city || 'Non spécifiée'}
- Région: ${data.location?.region || 'Non spécifiée'}
- Équipements: ${featuresList}

**CONTEXTE:**
- Estimation pour le marché immobilier de ${data.location?.country || 'cette région'}
- Ville: ${data.location?.city || 'Non spécifiée'}
- Prendre en compte l'économie locale et le coût de la vie

**INSTRUCTIONS:**
1. Fournir une estimation RÉALISTE en euros pour ${data.location?.city || 'cette ville'}, ${data.location?.country || 'cette région'}
2. Tenir compte du marché local et du pouvoir d'achat
3. Fourchette de prix: ±20%
4. Niveau de confiance: 70-90%
5. Expliquer les facteurs spécifiques au pays

**RÉPONSE EN JSON:**
{
  "estimation": 150000,
  "confidence": 75,
  "explanation": "Analyse basée sur le marché immobilier de ${data.location?.country || 'cette région'}...",
  "priceRange": {
    "min": 120000,
    "max": 180000
  },
  "factors": [
    {
      "factor": "Localisation - ${data.location?.country}",
      "impact": "neutral",
      "description": "Marché immobilier local pris en compte"
    }
  ]
}`;
}

// ======================================
// 🧠 Fonction : Appel à l'API Gemini
// ======================================
async function callGeminiAPI(prompt) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
    
  } catch (error) {
    console.error('❌ Erreur appel API Gemini:', error.message);
    throw error;
  }
}

// ======================================
// 🔄 Fonction : Parser la réponse Gemini
// ======================================
function parseGeminiResponse(text, locationData) {
  try {
    console.log('📝 Réponse Gemini:', text.substring(0, 200) + '...');
    
    let cleanedText = text.replace(/```json|```/g, '').trim();
    let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonMatch = [cleanedText.substring(firstBrace, lastBrace + 1)];
      }
    }
    
    if (!jsonMatch) {
      throw new Error('Aucun JSON trouvé');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    const baseEstimation = getBaseEstimationFromLocation(locationData);
    const estimation = typeof parsedResponse.estimation === 'number' 
      ? Math.max(10000, Math.round(parsedResponse.estimation))
      : baseEstimation;
    
    const confidence = Math.min(95, Math.max(60, parsedResponse.confidence || 75));

    return {
      estimation,
      confidence,
      explanation: parsedResponse.explanation || generateDefaultExplanation(locationData, estimation),
      priceRange: parsedResponse.priceRange || {
        min: Math.round(estimation * 0.8),
        max: Math.round(estimation * 1.2)
      },
      factors: Array.isArray(parsedResponse.factors) ? parsedResponse.factors : generateDefaultFactors(locationData),
      currency: 'EUR',
      location: locationData,
      timestamp: new Date().toISOString(),
      source: 'gemini'
    };
    
  } catch (error) {
    console.error('❌ Erreur parsing:', error.message);
    throw new Error(`Format invalide: ${error.message}`);
  }
}

// ======================================
// 🗺️ Base de données mondiale étendue
// ======================================
const GLOBAL_REAL_ESTATE_DATA = {
  // Afrique
  'madagascar': { basePrice: 500, cities: { 'antananarivo': 1.5, 'toamasina': 1.0, 'antsirabe': 0.8, 'fianarantsoa': 0.7, 'mahajanga': 0.9 } },
  'maroc': { basePrice: 1500, cities: { 'casablanca': 1.8, 'rabat': 1.5, 'marrakech': 1.6, 'fès': 1.2, 'tanger': 1.3 } },
  'tunisie': { basePrice: 1200, cities: { 'tunis': 1.5, 'sfax': 1.0, 'sousse': 1.2, 'kairouan': 0.8 } },
  'sénégal': { basePrice: 1000, cities: { 'dakar': 1.6, 'thiès': 0.8, 'saint-louis': 0.9 } },
  "côte d'ivoire": { basePrice: 900, cities: { 'abidjan': 1.7, 'bouaké': 0.7, 'daloa': 0.6 } },
  'cameroun': { basePrice: 800, cities: { 'douala': 1.5, 'yaoundé': 1.3, 'garoua': 0.6 } },
  
  // Europe
  'france': { basePrice: 4000, cities: { 'paris': 2.5, 'lyon': 1.2, 'marseille': 0.9, 'bordeaux': 1.3, 'nice': 1.5 } },
  'allemagne': { basePrice: 3500, cities: { 'berlin': 1.3, 'munich': 1.8, 'hamburg': 1.2, 'francfort': 1.4 } },
  'espagne': { basePrice: 2500, cities: { 'madrid': 1.2, 'barcelone': 1.3, 'valencia': 0.7, 'séville': 0.6 } },
  'italie': { basePrice: 3000, cities: { 'rome': 1.3, 'milan': 1.5, 'naples': 0.6, 'florence': 1.1 } },
  
  // Amériques
  'états-unis': { basePrice: 3500, cities: { 'new york': 2.5, 'los angeles': 1.8, 'chicago': 1.0, 'miami': 1.3 } },
  'canada': { basePrice: 3000, cities: { 'toronto': 1.5, 'vancouver': 1.8, 'montréal': 1.0, 'calgary': 0.9 } },
  'brésil': { basePrice: 1500, cities: { 'são paulo': 1.2, 'rio de janeiro': 1.3, 'brasilia': 0.8 } },
  'mexique': { basePrice: 1200, cities: { 'mexico': 1.3, 'guadalajara': 0.7, 'monterrey': 0.8 } },
  
  // Asie
  'japon': { basePrice: 4000, cities: { 'tokyo': 2.0, 'osaka': 1.2, 'kyoto': 1.1 } },
  'chine': { basePrice: 2500, cities: { 'shanghai': 1.8, 'beijing': 1.6, 'shenzhen': 1.4 } },
  'inde': { basePrice: 800, cities: { 'mumbai': 2.0, 'delhi': 1.5, 'bangalore': 1.2 } },
  'thailande': { basePrice: 1500, cities: { 'bangkok': 1.5, 'phuket': 1.2, 'chiang mai': 0.8 } },
  
  // Océanie
  'australie': { basePrice: 3500, cities: { 'sydney': 1.8, 'melbourne': 1.3, 'brisbane': 0.9 } }
};

function getBaseEstimationFromLocation(location) {
  if (!location || !location.country) return 150000;

  const countryName = location.country.toLowerCase();
  const cityName = location.city ? location.city.toLowerCase() : '';
  
  let basePricePerM2 = 1500; // Prix par défaut
  
  // Recherche du pays
  for (const [country, data] of Object.entries(GLOBAL_REAL_ESTATE_DATA)) {
    if (countryName.includes(country) || country.includes(countryName)) {
      basePricePerM2 = data.basePrice;
      
      // Application du multiplicateur de ville
      if (cityName && data.cities) {
        for (const [city, multiplier] of Object.entries(data.cities)) {
          if (cityName.includes(city) || city.includes(cityName)) {
            basePricePerM2 *= multiplier;
            break;
          }
        }
      }
      break;
    }
  }

  // Estimation pour un bien de 100m²
  return Math.round(basePricePerM2 * 100);
}

function generateDefaultExplanation(location, estimation) {
  const locationStr = location ? 
    `${location.city || ''}${location.city && location.country ? ', ' : ''}${location.country || ''}` :
    'cette localisation';
    
  return `Estimation basée sur un bien de 100m² à ${locationStr}. Analyse réalisée selon les données du marché immobilier international.`;
}

function generateDefaultFactors(location) {
  const factors = [{
    factor: 'Estimation internationale',
    impact: 'neutral',
    description: 'Basée sur les références de marché globales'
  }];

  if (location?.country) {
    factors.push({
      factor: `Pays - ${location.country}`,
      impact: 'neutral',
      description: 'Marché immobilier local pris en compte'
    });
  }

  if (location?.city) {
    factors.push({
      factor: `Ville - ${location.city}`,
      impact: 'neutral',
      description: 'Spécificités du marché urbain considérées'
    });
  }

  return factors;
}

// ======================================
// 📊 Route principale d'estimation
// ======================================
router.post('/estimate', async (req, res) => {
  const startTime = Date.now();
  const estimationData = req.body;

  console.log('🌍 Demande d\'estimation:', {
    type: estimationData.propertyType,
    surface: estimationData.surface,
    localisation: estimationData.location ? 
      `${estimationData.location.city}, ${estimationData.location.country}` : 
      'Non spécifiée'
  });

  // Validation
  if (!estimationData.surface || estimationData.surface < 10) {
    return res.status(400).json({ 
      success: false,
      error: 'Surface invalide (minimum 10m²)' 
    });
  }

  try {
    let result;
    let usedGemini = false;

    // Essayer Gemini si disponible
    if (geminiAvailable) {
      try {
        const prompt = buildPrompt(estimationData);
        console.log('🤖 Appel Gemini pour:', estimationData.location?.country);
        
        const geminiResponse = await callGeminiAPI(prompt);
        result = parseGeminiResponse(geminiResponse, estimationData.location);
        usedGemini = true;
        
      } catch (error) {
        console.log('🔄 Fallback pour', estimationData.location?.country);
        result = generateFallbackEstimation(estimationData);
      }
    } else {
      result = generateFallbackEstimation(estimationData);
    }

    // Enrichir le résultat
    const enhancedResult = {
      ...result,
      pricePerSquareMeter: Math.round(result.estimation / estimationData.surface),
      searchTime: `${Date.now() - startTime}ms`,
      usedAI: usedGemini,
      isFallback: !usedGemini
    };

    console.log('📊 Résultat:', {
      pays: estimationData.location?.country,
      estimation: enhancedResult.estimation,
      confiance: enhancedResult.confidence
    });

    res.json({
      success: true,
      ...enhancedResult
    });
    
  } catch (error) {
    console.error('💥 Erreur:', error);
    
    const emergencyResult = generateFallbackEstimation(estimationData);
    res.json({
      success: true,
      ...emergencyResult,
      error: 'Service en mode dégradé'
    });
  }
});

// ======================================
// 🏠 Fallback amélioré
// ======================================
function generateFallbackEstimation(data) {
  const basePricePerM2 = getBasePricePerM2Global(data.location?.country, data.location?.city);
  let price = data.surface * basePricePerM2;

  price *= getConditionMultiplier(data.condition);
  price *= getPropertyTypeMultiplier(data.propertyType);
  price *= getRoomsMultiplier(data.rooms);
  price += getFeaturesValue(data.features);

  const estimation = Math.round(price);
  
  return {
    estimation,
    confidence: 70,
    explanation: `Estimation basée sur votre bien de ${data.surface} m² à ${data.location?.city || ''}${data.location?.city && data.location?.country ? ', ' : ''}${data.location?.country || 'cette localisation'}.`,
    priceRange: {
      min: Math.round(estimation * 0.8),
      max: Math.round(estimation * 1.2)
    },
    factors: generateFallbackFactorsGlobal(data),
    timestamp: new Date().toISOString(),
    source: 'fallback'
  };
}

function getBasePricePerM2Global(country, city) {
  if (!country) return 1500;

  const countryName = country.toLowerCase();
  const cityName = city ? city.toLowerCase() : '';
  
  let basePricePerM2 = 1500;
  
  for (const [countryKey, data] of Object.entries(GLOBAL_REAL_ESTATE_DATA)) {
    if (countryName.includes(countryKey) || countryKey.includes(countryName)) {
      basePricePerM2 = data.basePrice;
      
      if (cityName && data.cities) {
        for (const [cityKey, multiplier] of Object.entries(data.cities)) {
          if (cityName.includes(cityKey) || cityKey.includes(cityName)) {
            basePricePerM2 *= multiplier;
            break;
          }
        }
      }
      break;
    }
  }

  return basePricePerM2;
}

function generateFallbackFactorsGlobal(data) {
  const factors = [];
  
  factors.push({
    factor: 'Surface habitable',
    impact: 'positive',
    description: `${data.surface} m²`
  });

  if (data.location?.country) {
    factors.push({
      factor: 'Pays',
      impact: 'neutral',
      description: data.location.country
    });
  }

  if (data.location?.city) {
    factors.push({
      factor: 'Ville',
      impact: 'neutral',
      description: data.location.city
    });
  }

  return factors;
}

// Fonctions utilitaires
function getConditionMultiplier(condition) {
  const multipliers = {
    'excellent': 1.2, 'good': 1.1, 'average': 1.0, 'needs_renovation': 0.8
  };
  return multipliers[condition] || 1.0;
}

function getPropertyTypeMultiplier(propertyType) {
  const multipliers = {
    'apartment': 1.0, 'house': 1.1, 'villa': 1.3, 'studio': 0.9,
    'loft': 1.2, 'duplex': 1.1, 'commercial': 1.4
  };
  return multipliers[propertyType] || 1.0;
}

function getRoomsMultiplier(rooms) {
  if (!rooms || rooms <= 1) return 0.9;
  if (rooms <= 2) return 0.95;
  if (rooms <= 3) return 1.0;
  if (rooms <= 4) return 1.05;
  if (rooms <= 5) return 1.1;
  return 1.15;
}

function getFeaturesValue(features) {
  if (!features) return 0;
  let value = 0;
  if (features.balcony) value += 5000;
  if (features.terrace) value += 10000;
  if (features.garden) value += 15000;
  if (features.parking) value += 20000;
  if (features.elevator) value += 10000;
  if (features.pool) value += 25000;
  if (features.basement) value += 8000;
  return value;
}

// Routes supplémentaires
router.post('/save', async (req, res) => {
  try {
    const { userId, estimationData, result } = req.body;
    const savedEstimation = {
      id: `est_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId || 'anonymous',
      ...estimationData,
      result,
      createdAt: new Date().toISOString()
    };
    
    res.json({ success: true, estimation: savedEstimation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/info', (req, res) => {
  res.json({
    success: true,
    service: 'Estimation Immobilière Internationale',
    status: geminiAvailable ? 'IA active' : 'Mode basique',
    supportedCountries: Object.keys(GLOBAL_REAL_ESTATE_DATA).length,
    features: ['Support mondial', 'Analyse par pays', 'Estimation en euros']
  });
});

// Initialisation
initializeGemini();

module.exports = router;