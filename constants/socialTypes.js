// constants/socialTypes.js

const SOCIAL_TYPES = {
  SHLMR: 'SHLMR',
  PSLA: 'PSLA',
  SHUR: 'SHUR',
  SIDR: 'SIDR',
  SODIAC: 'SODIAC',
  SEDRE: 'SEDRE',
  SEMAC: 'SEMAC'
};

const ALL_SOCIAL_TYPES = Object.values(SOCIAL_TYPES);

const SOCIAL_TYPE_LABELS = {
  [SOCIAL_TYPES.SHLMR]: 'SHLMR (Société Immobilière)',
  [SOCIAL_TYPES.PSLA]: 'PSLA (Prêt Social Location Accession)',
  [SOCIAL_TYPES.SHUR]: 'SHUR (Société HLM de la Réunion)',
  [SOCIAL_TYPES.SIDR]: 'SIDR (Société Immobilière Départementale de la Réunion)',
  [SOCIAL_TYPES.SODIAC]: 'SODIAC (Société pour le Développement Immobilier et l\'Accession à la Copropriété)',
  [SOCIAL_TYPES.SEDRE]: 'SEDRE (Société pour l\'Équipement et le Développement de la Réunion)',
  [SOCIAL_TYPES.SEMAC]: 'SEMAC (Société d\'Économie Mixte d\'Aménagement et de Construction)'
};

const SOCIAL_TYPE_DESCRIPTIONS = {
  [SOCIAL_TYPES.SHLMR]: 'Sociétés immobilières proposant des logements sociaux avec des loyers modérés',
  [SOCIAL_TYPES.PSLA]: 'Prêt Social Location Accession pour faciliter l\'accession à la propriété',
  [SOCIAL_TYPES.SHUR]: 'Société HLM de la Réunion - Logements sociaux adaptés au contexte réunionnais',
  [SOCIAL_TYPES.SIDR]: 'Société Immobilière Départementale de la Réunion - Développement immobilier social',
  [SOCIAL_TYPES.SODIAC]: 'Société pour le Développement Immobilier et l\'Accession à la Copropriété',
  [SOCIAL_TYPES.SEDRE]: 'Société pour l\'Équipement et le Développement de la Réunion',
  [SOCIAL_TYPES.SEMAC]: 'Société d\'Économie Mixte d\'Aménagement et de Construction'
};

// Liste des types pour le champ features
const SOCIAL_TYPE_FEATURES = ['SHUR', 'SIDR', 'SODIAC', 'SEDRE', 'SEMAC'];

// Types avec champs dédiés dans la base de données
const DEDICATED_SOCIAL_TYPES = ['SHLMR', 'PSLA'];

module.exports = {
  SOCIAL_TYPES,
  ALL_SOCIAL_TYPES,
  SOCIAL_TYPE_LABELS,
  SOCIAL_TYPE_DESCRIPTIONS,
  SOCIAL_TYPE_FEATURES,
  DEDICATED_SOCIAL_TYPES
};