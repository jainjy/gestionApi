// seedMetiers.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const metiersData = [
  {
    "id": 310,
    "libelle": "Accompagnateur touristique",
    "categorie": "TOURISME"
  },
  {
    "id": 2,
    "libelle": "Agence D'urbanisme",
    "categorie": "AUTRE"
  },
  {
    "id": 5,
    "libelle": "Agence Incendie - Sécurité",
    "categorie": "AUTRE"
  },
  {
    "id": 275,
    "libelle": "Agence immobilier",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 3,
    "libelle": "Agenceur (euse) - Désigner d'intérieur",
    "categorie": "ARTISAN"
  },
  {
    "id": 281,
    "libelle": "Agent Immobilier - Administrateur de biens",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 6,
    "libelle": "Agent Immobilier - Administrateur de biens ",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 205,
    "libelle": "Agent d'état des lieux",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 240,
    "libelle": "Agent de Ménage",
    "categorie": "ARTISAN"
  },
  {
    "id": 4,
    "libelle": "Agent de nettoyage - Propreté",
    "categorie": "ARTISAN"
  },
  {
    "id": 307,
    "libelle": "Agent de voyage",
    "categorie": "TOURISME"
  },
  {
    "id": 7,
    "libelle": "Aménageur - Lotisseur",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 8,
    "libelle": "Aménageur Extérieur",
    "categorie": "ARTISAN"
  },
  {
    "id": 9,
    "libelle": "Aménageur Intérieur",
    "categorie": "ARTISAN"
  },
  {
    "id": 230,
    "libelle": "Analyse de rentabilité",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 319,
    "libelle": "Animateur sportif",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 309,
    "libelle": "Animateur touristique",
    "categorie": "TOURISME"
  },
  {
    "id": 10,
    "libelle": "Architecte ",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 11,
    "libelle": "Architected Intérieur",
    "categorie": "ARTISAN"
  },
  {
    "id": 229,
    "libelle": "Archivage sécurisé 10 ans",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 12,
    "libelle": "Arroseur ",
    "categorie": "ARTISAN"
  },
  {
    "id": 304,
    "libelle": "Artisan & Profession",
    "categorie": "ARTISAN"
  },
  {
    "id": 264,
    "libelle": "Artisan bijoutier",
    "categorie": "ARTISAN"
  },
  {
    "id": 300,
    "libelle": "Artisan coutelier",
    "categorie": "ARTISAN"
  },
  {
    "id": 261,
    "libelle": "Artisan céramiste",
    "categorie": "ARTISAN"
  },
  {
    "id": 299,
    "libelle": "Artisan forgeron",
    "categorie": "ARTISAN"
  },
  {
    "id": 263,
    "libelle": "Artisan maroquinier",
    "categorie": "ARTISAN"
  },
  {
    "id": 268,
    "libelle": "Artisan maroquinier d'art",
    "categorie": "ARTISAN"
  },
  {
    "id": 262,
    "libelle": "Artisan tisserand",
    "categorie": "ARTISAN"
  },
  {
    "id": 267,
    "libelle": "Artisan vannier",
    "categorie": "ARTISAN"
  },
  {
    "id": 266,
    "libelle": "Artisan verrier",
    "categorie": "ARTISAN"
  },
  {
    "id": 265,
    "libelle": "Artisan ébéniste",
    "categorie": "ARTISAN"
  },
  {
    "id": 13,
    "libelle": "Ascensoriste",
    "categorie": "ARTISAN"
  },
  {
    "id": 209,
    "libelle": "Association",
    "categorie": "AUTRE"
  },
  {
    "id": 14,
    "libelle": "Assureur",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 15,
    "libelle": "Auditeur",
    "categorie": "AUTRE"
  },
  {
    "id": 16,
    "libelle": "Avocat",
    "categorie": "AUTRE"
  },
  {
    "id": 220,
    "libelle": "Bail personnalisé selon votre bien",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 17,
    "libelle": "Bailleur Social",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 18,
    "libelle": "Banquier",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 19,
    "libelle": "Bardeur",
    "categorie": "ARTISAN"
  },
  {
    "id": 235,
    "libelle": "BoutiqueNaturels",
    "categorie": "COMMERCE"
  },
  {
    "id": 20,
    "libelle": "Bricoleur",
    "categorie": "ARTISAN"
  },
  {
    "id": 21,
    "libelle": "Bureau d'étude",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 22,
    "libelle": "Cableur",
    "categorie": "ARTISAN"
  },
  {
    "id": 23,
    "libelle": "Calculateur et raitement des vibrations et chocs",
    "categorie": "ARTISAN"
  },
  {
    "id": 24,
    "libelle": "Canalisateur",
    "categorie": "ARTISAN"
  },
  {
    "id": 25,
    "libelle": "Carreleur",
    "categorie": "ARTISAN"
  },
  {
    "id": 26,
    "libelle": "Certifcateur - Contrôleur",
    "categorie": "AUTRE"
  },
  {
    "id": 28,
    "libelle": "Charpentier Métallique",
    "categorie": "ARTISAN"
  },
  {
    "id": 27,
    "libelle": "Charpentier bois",
    "categorie": "ARTISAN"
  },
  {
    "id": 29,
    "libelle": "Chef de Chantier",
    "categorie": "ARTISAN"
  },
  {
    "id": 202,
    "libelle": "Chef de chantier",
    "categorie": "ARTISAN"
  },
  {
    "id": 30,
    "libelle": "Cimentier",
    "categorie": "ARTISAN"
  },
  {
    "id": 222,
    "libelle": "Clauses spécifiques adaptées",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 31,
    "libelle": "Clerc de Notaire",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 278,
    "libelle": "Coach Nutrition",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 315,
    "libelle": "Coach sportif",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 32,
    "libelle": "Coffreur",
    "categorie": "ARTISAN"
  },
  {
    "id": 206,
    "libelle": "Commercial",
    "categorie": "COMMERCE"
  },
  {
    "id": 33,
    "libelle": "Compresseur",
    "categorie": "ARTISAN"
  },
  {
    "id": 34,
    "libelle": "Concasseur",
    "categorie": "ARTISAN"
  },
  {
    "id": 35,
    "libelle": "Concepteur",
    "categorie": "AUTRE"
  },
  {
    "id": 36,
    "libelle": "Conducteur de travaux",
    "categorie": "ARTISAN"
  },
  {
    "id": 221,
    "libelle": "Conforme à la loi ALUR",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 37,
    "libelle": "Consciergerie",
    "categorie": "AUTRE"
  },
  {
    "id": 38,
    "libelle": "Conseiller Assurance",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 41,
    "libelle": "Conseiller Immobilier",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 39,
    "libelle": "Conseiller bancaire",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 40,
    "libelle": "Conseiller en gestion de patrimoine",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 197,
    "libelle": "Conseiller en prêt immobilier",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 42,
    "libelle": "Conseiller télécom",
    "categorie": "AUTRE"
  },
  {
    "id": 233,
    "libelle": "Conseils en défiscalisation",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 224,
    "libelle": "Conseils juridiques inclus",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 43,
    "libelle": "Constructeur",
    "categorie": "ARTISAN"
  },
  {
    "id": 44,
    "libelle": "Constructeur de maison en Contenaire",
    "categorie": "ARTISAN"
  },
  {
    "id": 47,
    "libelle": "Contructeurs de maison en bois",
    "categorie": "ARTISAN"
  },
  {
    "id": 45,
    "libelle": "Contrôleur Bâtiment",
    "categorie": "ARTISAN"
  },
  {
    "id": 46,
    "libelle": "Contrôleur d'accés",
    "categorie": "ARTISAN"
  },
  {
    "id": 48,
    "libelle": "Courtier",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 50,
    "libelle": "Couvreur",
    "categorie": "ARTISAN"
  },
  {
    "id": 49,
    "libelle": "Couvreur",
    "categorie": "ARTISAN"
  },
  {
    "id": 292,
    "libelle": "Créateur bijoux",
    "categorie": "ARTISAN"
  },
  {
    "id": 274,
    "libelle": "Créateur bijoux textile",
    "categorie": "ARTISAN"
  },
  {
    "id": 270,
    "libelle": "Créateur céramique",
    "categorie": "ARTISAN"
  },
  {
    "id": 301,
    "libelle": "Créateur luminaire",
    "categorie": "ARTISAN"
  },
  {
    "id": 272,
    "libelle": "Créateur maroquinerie",
    "categorie": "ARTISAN"
  },
  {
    "id": 271,
    "libelle": "Créateur mobilier",
    "categorie": "ARTISAN"
  },
  {
    "id": 302,
    "libelle": "Créateur papier",
    "categorie": "ARTISAN"
  },
  {
    "id": 269,
    "libelle": "Créateur textile",
    "categorie": "ARTISAN"
  },
  {
    "id": 273,
    "libelle": "Créateur verre soufflé",
    "categorie": "ARTISAN"
  },
  {
    "id": 51,
    "libelle": "Cuisiniste",
    "categorie": "ARTISAN"
  },
  {
    "id": 52,
    "libelle": "Dalleur",
    "categorie": "ARTISAN"
  },
  {
    "id": 53,
    "libelle": "Dalleur",
    "categorie": "ARTISAN"
  },
  {
    "id": 227,
    "libelle": "Description détaillée du bien",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 63,
    "libelle": "Diagnostiqueur",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 239,
    "libelle": "Digitalisation",
    "categorie": "AUTRE"
  },
  {
    "id": 277,
    "libelle": "Diététicien",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 64,
    "libelle": "Domoticien",
    "categorie": "ARTISAN"
  },
  {
    "id": 223,
    "libelle": "Double exemplaire certifié",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 54,
    "libelle": "Décorateur intérieur",
    "categorie": "ARTISAN"
  },
  {
    "id": 55,
    "libelle": "Découpeur",
    "categorie": "ARTISAN"
  },
  {
    "id": 57,
    "libelle": "Démolisseur",
    "categorie": "ARTISAN"
  },
  {
    "id": 56,
    "libelle": "Déménageur",
    "categorie": "ARTISAN"
  },
  {
    "id": 58,
    "libelle": "Dératiseur - Désinfecteur",
    "categorie": "ARTISAN"
  },
  {
    "id": 59,
    "libelle": "Désamianteur",
    "categorie": "ARTISAN"
  },
  {
    "id": 60,
    "libelle": "Désenfumeur",
    "categorie": "ARTISAN"
  },
  {
    "id": 61,
    "libelle": "Déssinateur",
    "categorie": "ARTISAN"
  },
  {
    "id": 62,
    "libelle": "Déssinateur en bâtiment",
    "categorie": "ARTISAN"
  },
  {
    "id": 66,
    "libelle": "Ebéniste",
    "categorie": "ARTISAN"
  },
  {
    "id": 68,
    "libelle": "Echaffaudeur",
    "categorie": "ARTISAN"
  },
  {
    "id": 69,
    "libelle": "Eclairagiste",
    "categorie": "ARTISAN"
  },
  {
    "id": 70,
    "libelle": "Electricien",
    "categorie": "ARTISAN"
  },
  {
    "id": 71,
    "libelle": "Enduiseur",
    "categorie": "ARTISAN"
  },
  {
    "id": 317,
    "libelle": "Entraîneur sportif",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 207,
    "libelle": "Entreprise Abatatage, elagage, defrichage",
    "categorie": "ARTISAN"
  },
  {
    "id": 96,
    "libelle": "Entreprise deViabilistation, VRD, Terrassement",
    "categorie": "ARTISAN"
  },
  {
    "id": 217,
    "libelle": "Entretien et maintenance",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 282,
    "libelle": "Esthéticienne",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 72,
    "libelle": "Etancheur",
    "categorie": "ARTISAN"
  },
  {
    "id": 75,
    "libelle": "Expert Immobilier",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 74,
    "libelle": "Expert en assurance",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 76,
    "libelle": "Facadier",
    "categorie": "ARTISAN"
  },
  {
    "id": 77,
    "libelle": "Fleuriste",
    "categorie": "COMMERCE"
  },
  {
    "id": 78,
    "libelle": "Fontainier",
    "categorie": "ARTISAN"
  },
  {
    "id": 213,
    "libelle": "Formateur",
    "categorie": "AUTRE"
  },
  {
    "id": 79,
    "libelle": "Forreur",
    "categorie": "ARTISAN"
  },
  {
    "id": 80,
    "libelle": "Frigoriste",
    "categorie": "ARTISAN"
  },
  {
    "id": 216,
    "libelle": "Gestion des loyers et charges",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 200,
    "libelle": "Gestionnaire Locatif",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 201,
    "libelle": "Gestionnaire d'actifs immobilier",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 83,
    "libelle": "Gestionnaire de Sinistre",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 82,
    "libelle": "Gestionnaire de copropriété - Syndic",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 313,
    "libelle": "Gestionnaire de gîte",
    "categorie": "TOURISME"
  },
  {
    "id": 314,
    "libelle": "Gestionnaire de location saisonnière",
    "categorie": "TOURISME"
  },
  {
    "id": 308,
    "libelle": "Guide touristique",
    "categorie": "TOURISME"
  },
  {
    "id": 81,
    "libelle": "Géomètre",
    "categorie": "ARTISAN"
  },
  {
    "id": 204,
    "libelle": "Huissier de justice",
    "categorie": "AUTRE"
  },
  {
    "id": 236,
    "libelle": "IBR",
    "categorie": "AUTRE"
  },
  {
    "id": 303,
    "libelle": "Immobilier & Commerce",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 84,
    "libelle": "Ingénieur",
    "categorie": "ARTISAN"
  },
  {
    "id": 85,
    "libelle": "Ingénieur Civil",
    "categorie": "ARTISAN"
  },
  {
    "id": 89,
    "libelle": "Ingénieur Infrastructure",
    "categorie": "ARTISAN"
  },
  {
    "id": 86,
    "libelle": "Ingénieur en Batiment",
    "categorie": "ARTISAN"
  },
  {
    "id": 87,
    "libelle": "Ingénieur en Patrimoine - Conseiller Patrimonial",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 88,
    "libelle": "Ingénieur environnement",
    "categorie": "ARTISAN"
  },
  {
    "id": 90,
    "libelle": "Installateur - Installatrice en Sanitaires",
    "categorie": "ARTISAN"
  },
  {
    "id": 91,
    "libelle": "Installateur(trice) d'alarme",
    "categorie": "ARTISAN"
  },
  {
    "id": 92,
    "libelle": "Isolateur",
    "categorie": "ARTISAN"
  },
  {
    "id": 93,
    "libelle": "Jardinier",
    "categorie": "ARTISAN"
  },
  {
    "id": 241,
    "libelle": "Jardinier Paysagiste",
    "categorie": "ARTISAN"
  },
  {
    "id": 94,
    "libelle": "Juriste",
    "categorie": "AUTRE"
  },
  {
    "id": 210,
    "libelle": "Laveur Auto/voiture à domicile",
    "categorie": "ARTISAN"
  },
  {
    "id": 203,
    "libelle": "Mairie",
    "categorie": "AUTRE"
  },
  {
    "id": 97,
    "libelle": "Marbriers",
    "categorie": "ARTISAN"
  },
  {
    "id": 212,
    "libelle": "Masseur",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 95,
    "libelle": "Maçon",
    "categorie": "ARTISAN"
  },
  {
    "id": 98,
    "libelle": "Menuisier Aluminium et Alliage",
    "categorie": "ARTISAN"
  },
  {
    "id": 99,
    "libelle": "Menuisier Bois et Charpente",
    "categorie": "ARTISAN"
  },
  {
    "id": 100,
    "libelle": "Menuisier Metallique",
    "categorie": "ARTISAN"
  },
  {
    "id": 103,
    "libelle": "Menuisier PVC",
    "categorie": "ARTISAN"
  },
  {
    "id": 102,
    "libelle": "Menuisier Portes et Fenêtres",
    "categorie": "ARTISAN"
  },
  {
    "id": 101,
    "libelle": "Menuisier métalliques",
    "categorie": "ARTISAN"
  },
  {
    "id": 104,
    "libelle": "Metreur",
    "categorie": "ARTISAN"
  },
  {
    "id": 105,
    "libelle": "Miroitier",
    "categorie": "ARTISAN"
  },
  {
    "id": 321,
    "libelle": "Moniteur de sport",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 106,
    "libelle": "Monnteur en Installation de panneau Solaire",
    "categorie": "ARTISAN"
  },
  {
    "id": 107,
    "libelle": "Monteur de Chaudiere ",
    "categorie": "ARTISAN"
  },
  {
    "id": 114,
    "libelle": "Monteur en Installation Thermiques",
    "categorie": "ARTISAN"
  },
  {
    "id": 108,
    "libelle": "Monteur en Installation d'isolant",
    "categorie": "ARTISAN"
  },
  {
    "id": 109,
    "libelle": "Monteur en Installation de Climatisation",
    "categorie": "ARTISAN"
  },
  {
    "id": 110,
    "libelle": "Monteur en Installation de fosse septique",
    "categorie": "ARTISAN"
  },
  {
    "id": 111,
    "libelle": "Monteur en Installation de panneau photovoltaique",
    "categorie": "ARTISAN"
  },
  {
    "id": 115,
    "libelle": "Monteur en Installations de Barrière de Sécurité ",
    "categorie": "ARTISAN"
  },
  {
    "id": 116,
    "libelle": "Monteur en Installations de Pergola",
    "categorie": "ARTISAN"
  },
  {
    "id": 117,
    "libelle": "Monteur en Installations de volet Persiennes et jalousies",
    "categorie": "ARTISAN"
  },
  {
    "id": 113,
    "libelle": "Monteur en installation Sanitaire",
    "categorie": "ARTISAN"
  },
  {
    "id": 112,
    "libelle": "Monteur en installation de Store - Volet Roullant",
    "categorie": "ARTISAN"
  },
  {
    "id": 118,
    "libelle": "Monteur et Installateur de Caillebotis",
    "categorie": "ARTISAN"
  },
  {
    "id": 119,
    "libelle": "Monteur et Installateur de Cheminés",
    "categorie": "ARTISAN"
  },
  {
    "id": 120,
    "libelle": "Monteur et Installateur de Cloture",
    "categorie": "ARTISAN"
  },
  {
    "id": 121,
    "libelle": "Monteur et Installateur de Gazon",
    "categorie": "ARTISAN"
  },
  {
    "id": 122,
    "libelle": "Monteur et Installateur de Gouttiere",
    "categorie": "ARTISAN"
  },
  {
    "id": 123,
    "libelle": "Monteur et Installateur de Grilles et Rideaux métalliques",
    "categorie": "ARTISAN"
  },
  {
    "id": 124,
    "libelle": "Monteur et Installateur de Jaccuzi",
    "categorie": "ARTISAN"
  },
  {
    "id": 125,
    "libelle": "Monteur et Installateur de Moustiquaire",
    "categorie": "ARTISAN"
  },
  {
    "id": 126,
    "libelle": "Monteur et Installateur de Panneau d'affichage",
    "categorie": "COMMERCE"
  },
  {
    "id": 127,
    "libelle": "Monteur et Installateur de Parquet",
    "categorie": "ARTISAN"
  },
  {
    "id": 128,
    "libelle": "Monteur et Installateur de Pergolas Biocliamtiques",
    "categorie": "ARTISAN"
  },
  {
    "id": 129,
    "libelle": "Monteur et Installateur de Placards",
    "categorie": "ARTISAN"
  },
  {
    "id": 130,
    "libelle": "Monteur et Installateur de SPA",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 131,
    "libelle": "Monteur et Installateur de Tôle - Tôlerie ",
    "categorie": "ARTISAN"
  },
  {
    "id": 132,
    "libelle": "Monteur et Installateur en Domotique",
    "categorie": "ARTISAN"
  },
  {
    "id": 208,
    "libelle": "Monteur et Installeur de Hammam",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 133,
    "libelle": "Moquettiste",
    "categorie": "ARTISAN"
  },
  {
    "id": 134,
    "libelle": "Muraillier ",
    "categorie": "ARTISAN"
  },
  {
    "id": 135,
    "libelle": "Muralier",
    "categorie": "ARTISAN"
  },
  {
    "id": 280,
    "libelle": "Médecin Nutritionniste",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 279,
    "libelle": "Naturopathe",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 136,
    "libelle": "Nettoyeur",
    "categorie": "ARTISAN"
  },
  {
    "id": 244,
    "libelle": "Nettoyeur Spécialisé",
    "categorie": "ARTISAN"
  },
  {
    "id": 137,
    "libelle": "Notaire",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 276,
    "libelle": "Nutritionniste",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 138,
    "libelle": "Onduleur",
    "categorie": "ARTISAN"
  },
  {
    "id": 231,
    "libelle": "Optimisation fiscale",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 139,
    "libelle": "Outilleur",
    "categorie": "ARTISAN"
  },
  {
    "id": 140,
    "libelle": "Parquetteur",
    "categorie": "ARTISAN"
  },
  {
    "id": 141,
    "libelle": "Paysagiste ",
    "categorie": "ARTISAN"
  },
  {
    "id": 142,
    "libelle": "Peintre",
    "categorie": "ARTISAN"
  },
  {
    "id": 259,
    "libelle": "Peintre abstrait",
    "categorie": "ARTISAN"
  },
  {
    "id": 257,
    "libelle": "Peintre acrylique",
    "categorie": "ARTISAN"
  },
  {
    "id": 256,
    "libelle": "Peintre aquarelle",
    "categorie": "ARTISAN"
  },
  {
    "id": 291,
    "libelle": "Peintre contemporain",
    "categorie": "ARTISAN"
  },
  {
    "id": 290,
    "libelle": "Peintre figuratif",
    "categorie": "ARTISAN"
  },
  {
    "id": 297,
    "libelle": "Peintre fresquiste",
    "categorie": "ARTISAN"
  },
  {
    "id": 298,
    "libelle": "Peintre miniature",
    "categorie": "ARTISAN"
  },
  {
    "id": 258,
    "libelle": "Peintre mural",
    "categorie": "ARTISAN"
  },
  {
    "id": 289,
    "libelle": "Peintre paysagiste",
    "categorie": "ARTISAN"
  },
  {
    "id": 260,
    "libelle": "Peintre portraitiste",
    "categorie": "ARTISAN"
  },
  {
    "id": 255,
    "libelle": "Peintre à l'huile",
    "categorie": "ARTISAN"
  },
  {
    "id": 293,
    "libelle": "Photographe animalier",
    "categorie": "ARTISAN"
  },
  {
    "id": 285,
    "libelle": "Photographe architecture",
    "categorie": "ARTISAN"
  },
  {
    "id": 248,
    "libelle": "Photographe artistique",
    "categorie": "ARTISAN"
  },
  {
    "id": 286,
    "libelle": "Photographe culinaire",
    "categorie": "COMMERCE"
  },
  {
    "id": 249,
    "libelle": "Photographe de mode",
    "categorie": "COMMERCE"
  },
  {
    "id": 284,
    "libelle": "Photographe mariage",
    "categorie": "TOURISME"
  },
  {
    "id": 246,
    "libelle": "Photographe paysage",
    "categorie": "ARTISAN"
  },
  {
    "id": 245,
    "libelle": "Photographe portrait",
    "categorie": "ARTISAN"
  },
  {
    "id": 294,
    "libelle": "Photographe sportif",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 247,
    "libelle": "Photographe événementiel",
    "categorie": "TOURISME"
  },
  {
    "id": 226,
    "libelle": "Photos haute définition",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 143,
    "libelle": "Pisciniste",
    "categorie": "ARTISAN"
  },
  {
    "id": 144,
    "libelle": "Plaquiste",
    "categorie": "ARTISAN"
  },
  {
    "id": 145,
    "libelle": "Platrier - Plaquiste",
    "categorie": "ARTISAN"
  },
  {
    "id": 146,
    "libelle": "Plombier",
    "categorie": "ARTISAN"
  },
  {
    "id": 214,
    "libelle": "Podcasteur",
    "categorie": "AUTRE"
  },
  {
    "id": 147,
    "libelle": "Polisseur ",
    "categorie": "ARTISAN"
  },
  {
    "id": 198,
    "libelle": "Poseur",
    "categorie": "ARTISAN"
  },
  {
    "id": 199,
    "libelle": "Poseur de Borne",
    "categorie": "ARTISAN"
  },
  {
    "id": 148,
    "libelle": "Poseur de Comopteur d'eau",
    "categorie": "ARTISAN"
  },
  {
    "id": 149,
    "libelle": "Poseur de Compteur Gaz",
    "categorie": "ARTISAN"
  },
  {
    "id": 320,
    "libelle": "Professeur de fitness",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 150,
    "libelle": "Promoteur",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 318,
    "libelle": "Préparateur physique",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 151,
    "libelle": "Quincaillier",
    "categorie": "COMMERCE"
  },
  {
    "id": 152,
    "libelle": "Ramoneur",
    "categorie": "ARTISAN"
  },
  {
    "id": 153,
    "libelle": "Ravaleur",
    "categorie": "ARTISAN"
  },
  {
    "id": 215,
    "libelle": "Recherche et sélection de locataires",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 218,
    "libelle": "Relation locative complète",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 283,
    "libelle": "Relaxologue",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 322,
    "libelle": "Responsable de salle de sport",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 312,
    "libelle": "Responsable d'hébergement",
    "categorie": "TOURISME"
  },
  {
    "id": 311,
    "libelle": "Réceptionniste hôtelier",
    "categorie": "TOURISME"
  },
  {
    "id": 154,
    "libelle": "Récupérateur d'eau",
    "categorie": "ARTISAN"
  },
  {
    "id": 155,
    "libelle": "Récupérateur et traiteur d'aluminium",
    "categorie": "ARTISAN"
  },
  {
    "id": 156,
    "libelle": "Récupérateur et traiteur de boois",
    "categorie": "ARTISAN"
  },
  {
    "id": 157,
    "libelle": "Récupérateur et traiteur de déchets",
    "categorie": "ARTISAN"
  },
  {
    "id": 158,
    "libelle": "Récupérateur et traiteur de fer",
    "categorie": "ARTISAN"
  },
  {
    "id": 159,
    "libelle": "Récupérateur et traiteur plastiques",
    "categorie": "ARTISAN"
  },
  {
    "id": 160,
    "libelle": "Régleur de chaudiere, chauffage",
    "categorie": "ARTISAN"
  },
  {
    "id": 161,
    "libelle": "Réhabilitateur",
    "categorie": "ARTISAN"
  },
  {
    "id": 165,
    "libelle": "Réparateur Toiture ",
    "categorie": "ARTISAN"
  },
  {
    "id": 162,
    "libelle": "Réparateur d'appareil éléctroménager",
    "categorie": "ARTISAN"
  },
  {
    "id": 163,
    "libelle": "Réparateur de pompe à chaleur",
    "categorie": "ARTISAN"
  },
  {
    "id": 164,
    "libelle": "Réparateur et traiteur d'humidité",
    "categorie": "ARTISAN"
  },
  {
    "id": 166,
    "libelle": "Sableur",
    "categorie": "ARTISAN"
  },
  {
    "id": 167,
    "libelle": "Scieur ",
    "categorie": "ARTISAN"
  },
  {
    "id": 287,
    "libelle": "Sculpteur abstrait",
    "categorie": "ARTISAN"
  },
  {
    "id": 254,
    "libelle": "Sculpteur contemporain",
    "categorie": "ARTISAN"
  },
  {
    "id": 288,
    "libelle": "Sculpteur figuratif",
    "categorie": "ARTISAN"
  },
  {
    "id": 295,
    "libelle": "Sculpteur monumental",
    "categorie": "ARTISAN"
  },
  {
    "id": 250,
    "libelle": "Sculpteur sur bois",
    "categorie": "ARTISAN"
  },
  {
    "id": 296,
    "libelle": "Sculpteur sur glace",
    "categorie": "ARTISAN"
  },
  {
    "id": 252,
    "libelle": "Sculpteur sur métal",
    "categorie": "ARTISAN"
  },
  {
    "id": 251,
    "libelle": "Sculpteur sur pierre",
    "categorie": "ARTISAN"
  },
  {
    "id": 253,
    "libelle": "Sculpteur terre cuite",
    "categorie": "ARTISAN"
  },
  {
    "id": 228,
    "libelle": "Signature électronique",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 232,
    "libelle": "Simulation d'investissement",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 169,
    "libelle": "Solier",
    "categorie": "ARTISAN"
  },
  {
    "id": 170,
    "libelle": "Sollier Moquetiste",
    "categorie": "ARTISAN"
  },
  {
    "id": 171,
    "libelle": "Sondeur",
    "categorie": "ARTISAN"
  },
  {
    "id": 172,
    "libelle": "Soudeur",
    "categorie": "ARTISAN"
  },
  {
    "id": 306,
    "libelle": "Sport & Bien-être",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 173,
    "libelle": "Staffeur ",
    "categorie": "ARTISAN"
  },
  {
    "id": 174,
    "libelle": "Stucateur",
    "categorie": "ARTISAN"
  },
  {
    "id": 219,
    "libelle": "Suivi administratif et juridique",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 234,
    "libelle": "Suivi performance patrimoniale",
    "categorie": "IMMOBILIER"
  },
  {
    "id": 168,
    "libelle": "Sérrurier",
    "categorie": "ARTISAN"
  },
  {
    "id": 175,
    "libelle": "Tailleur de Pierre",
    "categorie": "ARTISAN"
  },
  {
    "id": 242,
    "libelle": "Technicien Piscine",
    "categorie": "ARTISAN"
  },
  {
    "id": 182,
    "libelle": "Technicien Planchers",
    "categorie": "ARTISAN"
  },
  {
    "id": 183,
    "libelle": "Technicien Réseau Internet",
    "categorie": "ARTISAN"
  },
  {
    "id": 184,
    "libelle": "Technicien Réseau téléphonique",
    "categorie": "ARTISAN"
  },
  {
    "id": 176,
    "libelle": "Technicien d'équipements Piscine",
    "categorie": "ARTISAN"
  },
  {
    "id": 177,
    "libelle": "Technicien de Maintenance",
    "categorie": "ARTISAN"
  },
  {
    "id": 243,
    "libelle": "Technicien en Sécurité",
    "categorie": "ARTISAN"
  },
  {
    "id": 178,
    "libelle": "Technicien et Traitement de l'air",
    "categorie": "ARTISAN"
  },
  {
    "id": 179,
    "libelle": "Technicien et Traitement de l'eau",
    "categorie": "ARTISAN"
  },
  {
    "id": 180,
    "libelle": "Technicien et Traitement des Sols",
    "categorie": "ARTISAN"
  },
  {
    "id": 181,
    "libelle": "Technicien et Traitement des termites",
    "categorie": "ARTISAN"
  },
  {
    "id": 185,
    "libelle": "Terrasseur",
    "categorie": "ARTISAN"
  },
  {
    "id": 211,
    "libelle": "Thérapeute",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 186,
    "libelle": "Topographe",
    "categorie": "ARTISAN"
  },
  {
    "id": 305,
    "libelle": "Tourisme & Loisirs",
    "categorie": "TOURISME"
  },
  {
    "id": 187,
    "libelle": "Treillageur",
    "categorie": "ARTISAN"
  },
  {
    "id": 188,
    "libelle": "Vendeur - Commercant ",
    "categorie": "COMMERCE"
  },
  {
    "id": 189,
    "libelle": "Vendeur de Carrelage",
    "categorie": "COMMERCE"
  },
  {
    "id": 190,
    "libelle": "Vendeur de Ciment",
    "categorie": "COMMERCE"
  },
  {
    "id": 191,
    "libelle": "Vendeur de Matériaux",
    "categorie": "COMMERCE"
  },
  {
    "id": 192,
    "libelle": "Ventiliste",
    "categorie": "ARTISAN"
  },
  {
    "id": 193,
    "libelle": "Viabilisateur",
    "categorie": "ARTISAN"
  },
  {
    "id": 194,
    "libelle": "Vidangeur",
    "categorie": "ARTISAN"
  },
  {
    "id": 195,
    "libelle": "Vitrier",
    "categorie": "ARTISAN"
  },
  {
    "id": 196,
    "libelle": "Zingueur",
    "categorie": "ARTISAN"
  },
  {
    "id": 237,
    "libelle": "art et commerce",
    "categorie": "COMMERCE"
  },
  {
    "id": 238,
    "libelle": "espace ameublements",
    "categorie": "COMMERCE"
  },
  {
    "id": 65,
    "libelle": "Ébéniste",
    "categorie": "ARTISAN"
  },
  {
    "id": 67,
    "libelle": "Échafaudeur",
    "categorie": "ARTISAN"
  },
  {
    "id": 316,
    "libelle": "Éducateur sportif",
    "categorie": "BIEN_ETRE"
  },
  {
    "id": 73,
    "libelle": "Étancheur - Étanchéiste",
    "categorie": "ARTISAN"
  },
  {
    "id": 225,
    "libelle": "État des lieux d'entrée et sortie",
    "categorie": "IMMOBILIER"
  }
]

async function main() {
  console.log('Début de la mise à jour des métiers...')
  
  let successCount = 0
  let errorCount = 0

  for (const metierData of metiersData) {
    try {
      // Chercher le métier par son libellé
      const existingMetier = await prisma.metier.findFirst({
        where: { libelle: metierData.libelle }
      })

      if (existingMetier) {
        // Mettre à jour le métier existant
        await prisma.metier.update({
          where: { id: existingMetier.id },
          data: { categorie: metierData.categorie }
        })
        console.log(`✓ Métier mis à jour: ${metierData.libelle} (${metierData.categorie})`)
        successCount++
      } else {
        // Créer un nouveau métier s'il n'existe pas
        await prisma.metier.create({
          data: {
            libelle: metierData.libelle,
            categorie: metierData.categorie
          }
        })
        console.log(`+ Métier créé: ${metierData.libelle} (${metierData.categorie})`)
        successCount++
      }
    } catch (error) {
      console.error(`✗ Erreur pour ${metierData.libelle}:`, error.message)
      errorCount++
    }
  }

  console.log(`\nRésumé:`)
  console.log(`✓ ${successCount} métiers traités avec succès`)
  console.log(`✗ ${errorCount} erreurs`)
}

main()
  .catch((e) => {
    console.error('Erreur lors de l\'exécution du seeder:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })