// En haut du fichier, ajouter :
const { body } = require('express-validator');
const validator = require('validator'); // Ajouter cette ligne

const eventValidationRules = [
  // Champs requis
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Le titre est requis')
    .isLength({ max: 255 })
    .withMessage('Le titre ne doit pas dépasser 255 caractères'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('La description ne doit pas dépasser 2000 caractères'),
  
  body('date')
    .notEmpty()
    .withMessage('La date est requise')
    .isISO8601()
    .withMessage('Format de date invalide (YYYY-MM-DD)'),
  
  body('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Format d\'heure invalide (HH:MM)'),
  
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Format d\'heure invalide (HH:MM)'),
  
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Le lieu est requis')
    .isLength({ max: 255 })
    .withMessage('Le lieu ne doit pas dépasser 255 caractères'),
  
  body('category')
    .trim()
    .notEmpty()
    .withMessage('La catégorie est requise')
    .isLength({ max: 100 })
    .withMessage('La catégorie ne doit pas dépasser 100 caractères'),
  
  // Champs optionnels supplémentaires
  body('address')
    .optional()
    .isLength({ max: 255 })
    .withMessage('L\'adresse ne doit pas dépasser 255 caractères'),
  
  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La ville ne doit pas dépasser 100 caractères'),
  
  body('postalCode')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Le code postal ne doit pas dépasser 20 caractères'),
  
  body('subCategory')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La sous-catégorie ne doit pas dépasser 100 caractères'),
  
  // Champs numériques
  body('capacity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('La capacité doit être un nombre positif'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  
  body('discountPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix réduit doit être un nombre positif'),
  
  body('earlyBirdPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix early bird doit être un nombre positif'),
  
  // CORRIGÉ : Utiliser les valeurs de l'enum EventStatus en MAJUSCULES
  body('status')
    .optional()
    .isIn(['DRAFT', 'ACTIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED', 'ARCHIVED'])
    .withMessage('Statut invalide. Valeurs autorisées: DRAFT, ACTIVE, UPCOMING, COMPLETED, CANCELLED, ARCHIVED'),
  
  // CORRIGÉ : Utiliser les valeurs de l'enum Difficulty en MAJUSCULES
  body('difficulty')
    .optional()
    .isIn(['EASY', 'MEDIUM', 'HARD'])
    .withMessage('Difficulté invalide. Valeurs autorisées: EASY, MEDIUM, HARD'),
  
  // CORRIGÉ : Utiliser les valeurs de l'enum Visibility en MAJUSCULES
  body('visibility')
    .optional()
    .isIn(['PUBLIC', 'PRIVATE', 'INVITE_ONLY'])
    .withMessage('Visibilité invalide. Valeurs autorisées: PUBLIC, PRIVATE, INVITE_ONLY'),
  
  body('currency')
    .optional()
    .isIn(['EUR', 'USD', 'MGA', 'GBP', 'JPY', 'CNY'])
    .withMessage('Devise invalide'),
  
  // CORRIGÉ : Validation email avec validator
  body('contactEmail')
    .optional()
    .custom((value) => {
      if (value && value.trim() !== '') {
        if (!validator.isEmail(value)) {
          throw new Error('Email invalide');
        }
      }
      return true;
    })
    .normalizeEmail(),
  
  body('contactPhone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Le téléphone ne doit pas dépasser 20 caractères'),
  
  body('organizer')
    .optional()
    .isLength({ max: 255 })
    .withMessage('L\'organisateur ne doit pas dépasser 255 caractères'),
  
  // URL
  body('website')
    .optional()
    .isURL()
    .withMessage('URL invalide'),
  
  body('image')
    .optional()
    .isURL()
    .withMessage('URL d\'image invalide'),
  
  // Tableaux - VERSION CORRIGÉE
  body('tags')
    .optional()
    .custom((value) => {
      if (!value) return true; // Champ vide est accepté
      
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error('Les tags doivent être un tableau JSON');
          }
          return true;
        } catch (error) {
          throw new Error('Format JSON invalide pour les tags');
        }
      }
      
      if (!Array.isArray(value)) {
        throw new Error('Les tags doivent être un tableau');
      }
      return true;
    }),
  
  body('images')
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error('Les images doivent être un tableau JSON');
          }
          return true;
        } catch (error) {
          throw new Error('Format JSON invalide pour les images');
        }
      }
      
      if (!Array.isArray(value)) {
        throw new Error('Les images doivent être un tableau');
      }
      return true;
    }),
  
  body('highlights')
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error('Les highlights doivent être un tableau JSON');
          }
          return true;
        } catch (error) {
          throw new Error('Format JSON invalide pour les highlights');
        }
      }
      
      if (!Array.isArray(value)) {
        throw new Error('Les highlights doivent être un tableau');
      }
      return true;
    }),
  
  body('targetAudience')
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error('Le public cible doit être un tableau JSON');
          }
          return true;
        } catch (error) {
          throw new Error('Format JSON invalide pour le public cible');
        }
      }
      
      if (!Array.isArray(value)) {
        throw new Error('Le public cible doit être un tableau');
      }
      return true;
    }),
  
  body('includes')
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error('Les inclusions doivent être un tableau JSON');
          }
          return true;
        } catch (error) {
          throw new Error('Format JSON invalide pour les inclusions');
        }
      }
      
      if (!Array.isArray(value)) {
        throw new Error('Les inclusions doivent être un tableau');
      }
      return true;
    }),
  
  body('notIncludes')
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error('Les exclusions doivent être un tableau JSON');
          }
          return true;
        } catch (error) {
          throw new Error('Format JSON invalide pour les exclusions');
        }
      }
      
      if (!Array.isArray(value)) {
        throw new Error('Les exclusions doivent être un tableau');
      }
      return true;
    }),
  
  // Champs texte supplémentaires
  body('duration')
    .optional()
    .isLength({ max: 50 })
    .withMessage('La durée ne doit pas dépasser 50 caractères'),
  
  body('cancellationPolicy')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La politique d\'annulation ne doit pas dépasser 500 caractères'),
  
  body('refundPolicy')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La politique de remboursement ne doit pas dépasser 500 caractères'),
  
  body('requirements')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Les prérequis ne doivent pas dépasser 1000 caractères'),
  
  // Dates optionnelles
  body('registrationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Format de date d\'inscription invalide'),
  
  body('earlyBirdDeadline')
    .optional()
    .isISO8601()
    .withMessage('Format de date early bird invalide'),
  
  // Validation booléenne
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Le champ featured doit être un booléen')
];

// Règles de validation pour les découvertes
const discoveryValidationRules = [
  // Champs requis
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Le titre est requis')
    .isLength({ max: 255 })
    .withMessage('Le titre ne doit pas dépasser 255 caractères'),
  
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Le type est requis')
    .isLength({ max: 100 })
    .withMessage('Le type ne doit pas dépasser 100 caractères'),
  
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Le lieu est requis')
    .isLength({ max: 255 })
    .withMessage('Le lieu ne doit pas dépasser 255 caractères'),
  
  // CORRIGÉ : Utiliser les valeurs de l'enum Difficulty en MAJUSCULES
  body('difficulty')
    .notEmpty()
    .withMessage('La difficulté est requise')
    .isIn(['EASY', 'MEDIUM', 'HARD'])
    .withMessage('Difficulté invalide. Valeurs autorisées: EASY, MEDIUM, HARD'),
  
  body('duration')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La durée ne doit pas dépasser 100 caractères'),
  
  // Champs numériques
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('La note doit être entre 0 et 5'),
  
  body('maxVisitors')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le nombre maximum de visiteurs doit être au moins 1'),
  
  body('sustainabilityRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('La note de durabilité doit être entre 0 et 5'),
  
  // CORRIGÉ : Utiliser les noms de champ du modèle
  body('groupSizeMin')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La taille minimale du groupe doit être au moins 1'),
  
  body('groupSizeMax')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La taille maximale du groupe doit être au moins 1'),
  
  body('ageRestrictionMin')
    .optional()
    .isInt({ min: 0 })
    .withMessage('L\'âge minimum doit être un nombre positif'),
  
  body('ageRestrictionMax')
    .optional()
    .isInt({ min: 0 })
    .withMessage('L\'âge maximum doit être un nombre positif'),
  
  // CORRIGÉ : Utiliser les valeurs de l'enum DiscoveryStatus en MAJUSCULES
  body('status')
    .optional()
    .isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'ACTIVE'])
    .withMessage('Statut invalide. Valeurs autorisées: DRAFT, PUBLISHED, ARCHIVED, ACTIVE'),
  
  body('currency')
    .optional()
    .isIn(['EUR', 'USD', 'MGA', 'GBP', 'JPY', 'CNY'])
    .withMessage('Devise invalide'),
  
  // Email
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  // URL
  body('website')
    .optional()
    .isURL()
    .withMessage('URL invalide'),
  
  body('image')
    .optional()
    .isURL()
    .withMessage('URL d\'image invalide'),
  
  // Tableaux
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Les tags doivent être un tableau'),
  
  body('images')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Les images doivent être un tableau'),
  
  body('highlights')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Les highlights doivent être un tableau'),
  
  body('bestSeason')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Les meilleures saisons doivent être un tableau'),
  
  body('bestTime')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Les meilleurs moments doivent être un tableau'),
  
  body('availableDates')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Les dates disponibles doivent être un tableau'),
  
  body('languages')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Les langues doivent être un tableau'),
  
  body('equipment')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('L\'équipement doit être un tableau'),
  
  body('includes')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Les inclusions doivent être un tableau'),
  
  body('notIncludes')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Les exclusions doivent être un tableau'),
  
  body('includedServices')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Les services inclus doivent être un tableau'),
  
  body('requirements')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return true;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Les exigences doivent être un tableau'),
  
  // Coordonnées
  body('coordinates')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return typeof parsed === 'object' && parsed !== null;
        } catch {
          return true;
        }
      }
      return typeof value === 'object' && value !== null;
    })
    .withMessage('Les coordonnées doivent être un objet'),
  
  // Booléens
  body('guideIncluded')
    .optional()
    .isBoolean()
    .withMessage('guideIncluded doit être un booléen'),
  
  body('transportIncluded')
    .optional()
    .isBoolean()
    .withMessage('transportIncluded doit être un booléen'),
  
  body('mealIncluded')
    .optional()
    .isBoolean()
    .withMessage('mealIncluded doit être un booléen'),
  
  body('parkingAvailable')
    .optional()
    .isBoolean()
    .withMessage('parkingAvailable doit être un booléen'),
  
  body('wifiAvailable')
    .optional()
    .isBoolean()
    .withMessage('wifiAvailable doit être un booléen'),
  
  body('familyFriendly')
    .optional()
    .isBoolean()
    .withMessage('familyFriendly doit être un booléen'),
  
  body('petFriendly')
    .optional()
    .isBoolean()
    .withMessage('petFriendly doit être un booléen'),
  
  body('wheelchairAccessible')
    .optional()
    .isBoolean()
    .withMessage('wheelchairAccessible doit être un booléen')
];

// Règles pour la mise à jour du statut featured
const toggleFeaturedRules = [
  body('featured')
    .notEmpty()
    .withMessage('Le champ featured est requis')
    .isBoolean()
    .withMessage('featured doit être un booléen')
];

module.exports = {
  eventValidationRules,
  discoveryValidationRules,
  toggleFeaturedRules
};