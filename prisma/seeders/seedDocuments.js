// prisma/seed-documents.js
const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker/locale/fr");

const prisma = new PrismaClient();

// URLs d'images réelles pour les documents (images libres de droits)
const DOCUMENT_IMAGES = [
  "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop", // Contrat
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop", // Assurance
  "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=400&h=300&fit=crop", // Diplôme
  "https://images.unsplash.com/photo-1554224154-2607d78e1f7a?w=400&h=300&fit=crop", // Certification
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop", // Document légal
  "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=400&h=300&fit=crop", // Archive
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop", // Immobilier
];

const TYPES_DOCUMENTS = [
  "ASSURANCE",
  "DIPLOME",
  "CERTIFICATION",
  "CONTRAT",
  "CGV",
  "ARCHIVE",
  "IMMOBILIER",
];
const STATUT_DOCUMENT = ["VALIDE", "EXPIRANT", "EXPIRE", "EN_ATTENTE"];
const CATEGORIES_IMMOBILIER = [
  "REVENU_FONCIER",
  "BAIL_LOCATION",
  "QUITTANCE_LOYER",
  "ETAT_LIEUX",
  "GESTION",
  "AUTRE",
];

// Noms de documents réalistes par type
const DOCUMENT_NAMES = {
  ASSURANCE: [
    "Assurance Responsabilité Civile Professionnelle",
    "Assurance Multirisque Professionnelle",
    "Assurance Dommages-Ouvrage",
    "Assurance Décennale",
    "Assurance Tous Risques Chantier",
    "Assurance Protection Juridique",
  ],
  DIPLOME: [
    "Diplôme d'État Agent Immobilier",
    "Master Immobilier et Gestion Patrimoniale",
    "BTS Professions Immobilières",
    "Certificat de Formation Professionnelle",
    "Diplôme de Gestion de Patrimoine",
    "Licence Professionnelle Immobilier",
  ],
  CERTIFICATION: [
    "Certification AMF - Autorité des Marchés Financiers",
    "Certification CCI - Transaction Immobilière",
    "Certification NF Service Mandataire Immobilier",
    "Certification RGE - Reconnu Garant de l'Environnement",
    "Certification Management de la Qualité",
    "Certification Diagnostic Immobilier",
  ],
  CONTRAT: [
    "Contrat de Mandat Exclusif de Vente",
    "Contrat de Mandat Simple de Vente",
    "Contrat de Gestion Locative",
    "Contrat de Promotion Immobilière",
    "Contrat de Reservation (VEFA)",
    "Contrat de Sous-traitance",
  ],
  CGV: [
    "Conditions Générales de Vente - Agence Immobilière",
    "Conditions Générales de Location",
    "CGV Prestations de Service",
    "Conditions d'Utilisation Plateforme",
    "CGV Gestion Patrimoniale",
    "Conditions Commerciales Partenaires",
  ],
  ARCHIVE: [
    "Archive - Dossier Client 2023",
    "Archive - Transaction Finalisée 2022",
    "Archive - Audit Interne 2023",
    "Archive - Comptes Annuels 2022",
    "Archive - Procès-verbal AG",
    "Archive - Contrôle Fiscal 2021",
  ],
  IMMOBILIER: [
    "Compromis de Vente - Villa Les Roses",
    "Bail Commercial - Centre Ville",
    "État des Lieux Entrée - Appartement T3",
    "Quittance de Loyer Mars 2024",
    "Déclaration Revenus Fonciers 2023",
    "Diagnostics Techniques - Maison Individuelle",
  ],
};

async function main() {
  console.log("🌱 Début du seeding des documents...");

  // Récupérer les utilisateurs avec le rôle "professional"
  const professionalUsers = await prisma.user.findMany({
    where: {
      OR: [
        { role: "professional" },
        { email: "pro@servo.mg" },
      ],
    },
    take: 10, // Prendre 10 utilisateurs maximum
  });

  if (professionalUsers.length === 0) {
    console.log(
      "❌ Aucun utilisateur professionnel trouvé. Création de quelques utilisateurs..."
    );

    // Créer quelques utilisateurs professionnels de test
    const testUsers = await Promise.all([
      prisma.user.create({
        data: {
          email: "agence.immobiliere@example.com",
          firstName: "Pierre",
          lastName: "Martin",
          role: "professional",
          userType: "AGENCE",
          companyName: "Agence Immobilière Martin",
          status: "active",
        },
      }),
      prisma.user.create({
        data: {
          email: "conseiller.patrimoine@example.com",
          firstName: "Sophie",
          lastName: "Dubois",
          role: "professional",
          userType: "PRESTATAIRE",
          companyName: "Conseil en Patrimoine Dubois",
          status: "active",
        },
      }),
      prisma.user.create({
        data: {
          email: "gestion.locative@example.com",
          firstName: "Thomas",
          lastName: "Bernard",
          role: "professional",
          userType: "AGENCE",
          companyName: "Gestion Locative Pro",
          status: "active",
        },
      }),
    ]);

    professionalUsers.push(...testUsers);
  }

  console.log(
    `👥 ${professionalUsers.length} utilisateurs professionnels trouvés`
  );

  // 1. Seed des Documents
  console.log("📄 Création des documents...");

  const documents = [];
  for (let i = 0; i < 50; i++) {
    const user = faker.helpers.arrayElement(professionalUsers);
    const type = faker.helpers.arrayElement(TYPES_DOCUMENTS);
    const nom = faker.helpers.arrayElement(DOCUMENT_NAMES[type]);

    const dateUpload = faker.date.past({ years: 2 });
    const dateExpiration = faker.datatype.boolean(0.7)
      ? faker.date.future({ years: 2 })
      : null;

    // Déterminer le statut basé sur la date d'expiration
    let statut = "VALIDE";
    if (dateExpiration) {
      const maintenant = new Date();
      const diffTemps = dateExpiration - maintenant;
      const diffJours = Math.ceil(diffTemps / (1000 * 60 * 60 * 24));

      if (diffJours < 0) {
        statut = "EXPIRE";
      } else if (diffJours <= 30) {
        statut = "EXPIRANT";
      }
    }

    const document = {
      nom,
      type,
      categorie:
        type === "IMMOBILIER"
          ? faker.helpers.arrayElement(CATEGORIES_IMMOBILIER)
          : null,
      description: faker.lorem.paragraph(),
      dateExpiration,
      dateUpload,
      statut,
      taille: `${faker.number.float({ min: 0.1, max: 10, fractionDigits: 1 })} MB`,
      format: faker.helpers.arrayElement(["PDF", "DOCX", "JPG", "PNG"]),
      url: faker.helpers.arrayElement(DOCUMENT_IMAGES),
      cheminFichier: `documents/${faker.string.uuid()}.${faker.helpers.arrayElement(["pdf", "docx", "jpg", "png"])}`,
      tags: faker.helpers.arrayElements(
        [
          "Important",
          "Obligatoire",
          "Annuel",
          "Mensuel",
          "Archivé",
          "Signé",
          "En cours",
        ],
        { min: 1, max: 3 }
      ),
      userId: user.id,
      createdAt: dateUpload,
      updatedAt: faker.date.between({ from: dateUpload, to: new Date() }),
    };

    documents.push(document);
  }

  // Insérer les documents en base
  for (const doc of documents) {
    await prisma.document.create({
      data: doc,
    });
  }

  console.log(`✅ ${documents.length} documents créés`);

  // 2. Seed des Contrats Types
  console.log("📝 Création des contrats types...");

  const contratsTypes = [
    {
      nom: "Mandat Exclusif de Vente",
      description:
        "Contrat standard pour la vente exclusive d'un bien immobilier",
      contenu: `CONTRAT DE MANDAT EXCLUSIF DE VENTE

Entre les soussignés :
[PROPRIETAIRE], propriétaire du bien situé à [ADRESSE]
et
[AGENCE], agence immobilière représentée par [NOM_AGENT]

ARTICLE 1 - OBJET
Le propriétaire donne mandat exclusif à l'agence pour la vente du bien décrit ci-dessous.

ARTICLE 2 - DURÉE
Le présent mandat est conclu pour une durée de [DUREE] mois à compter de ce jour.

ARTICLE 3 - PRIX DE VENTE
Le prix de vente convenu est fixé à [PRIX] euros.

ARTICLE 4 - COMMISSION
La commission de l'agence est fixée à [COMMISSION]% du prix de vente.`,
      variables: [
        "PROPRIETAIRE",
        "ADRESSE",
        "AGENCE",
        "NOM_AGENT",
        "DUREE",
        "PRIX",
        "COMMISSION",
      ],
      utilise: faker.number.int({ min: 5, max: 50 }),
    },
    {
      nom: "Contrat de Location",
      description: "Contrat type pour la location d'un bien immobilier",
      contenu: `CONTRAT DE LOCATION D'HABITATION

Entre :
[BAILLEUR], propriétaire du logement situé à [ADRESSE]
et
[LOCATAIRE], demeurant à [ADRESSE_LOCATAIRE]

ARTICLE 1 - OBJET
Le présent contrat a pour objet la location du logement décrit ci-après.

ARTICLE 2 - DURÉE
La durée du contrat est fixée à [DURÉE] mois.

ARTICLE 3 - LOYER
Le loyer mensuel est fixé à [LOYER] euros.

ARTICLE 4 - CAUTION
Le locataire verse une caution de [CAUTION] euros.`,
      variables: [
        "BAILLEUR",
        "ADRESSE",
        "LOCATAIRE",
        "ADRESSE_LOCATAIRE",
        "LOYER",
        "CAUTION",
        "DURÉE",
      ],
      utilise: faker.number.int({ min: 10, max: 100 }),
    },
    {
      nom: "Compromis de Vente",
      description: "Contrat type pour le compromis de vente immobilier",
      contenu: `COMPROMIS DE VENTE IMMOBILIÈRE

Entre :
[VENDEUR], propriétaire du bien situé à [ADRESSE]
et
[ACHETEUR], demeurant à [ADRESSE_ACHETEUR]

ARTICLE 1 - OBJET
Par le présent compromis, les parties conviennent de la vente du bien immobilier décrit ci-dessous.

ARTICLE 2 - PRIX
Le prix de vente est fixé à [PRIX] euros.

ARTICLE 3 - CONDITIONS SUSPENSIVES
La vente est soumise aux conditions suspensives habituelles.

ARTICLE 4 - NOTAIRE
Maître [NOTAIRE] est désigné comme notaire chargé de la transaction.

ARTICLE 5 - DATE DE SIGNATURE
Fait à [LIEU_SIGNATURE], le [DATE_SIGNATURE]`,
      variables: [
        "VENDEUR",
        "ADRESSE",
        "ACHETEUR",
        "ADRESSE_ACHETEUR",
        "PRIX",
        "NOTAIRE",
        "LIEU_SIGNATURE",
        "DATE_SIGNATURE",
      ],
      utilise: faker.number.int({ min: 8, max: 80 }),
    },
    {
      nom: "État des Lieux d'Entrée",
      description: "Modèle d'état des lieux d'entrée pour location",
      contenu: `ÉTAT DES LIEUX D'ENTRÉE

Logement situé : [ADRESSE_BIEN]
Type : [TYPE_BIEN]
Surface : [SURFACE] m²

Entre le bailleur : [NOM_BAILLEUR]
Et le locataire : [NOM_LOCATAIRE]

DATE : [DATE_ETAT_LIEUX]

DESCRIPTION DES LIEUX :

PIÈCE PAR PIÈCE :
- Séjour : [DESCRIPTION_SEJOUR]
- Cuisine : [DESCRIPTION_CUISINE]
- Chambre 1 : [DESCRIPTION_CHAMBRE1]
- Salle de bain : [DESCRIPTION_SDB]
- WC : [DESCRIPTION_WC]

ÉQUIPEMENTS :
[LISTE_EQUIPEMENTS]

OBSERVATIONS :
[OBSERVATIONS]

Signature des parties :`,
      variables: [
        "ADRESSE_BIEN",
        "TYPE_BIEN",
        "SURFACE",
        "NOM_BAILLEUR",
        "NOM_LOCATAIRE",
        "DATE_ETAT_LIEUX",
        "DESCRIPTION_SEJOUR",
        "DESCRIPTION_CUISINE",
        "DESCRIPTION_CHAMBRE1",
        "DESCRIPTION_SDB",
        "DESCRIPTION_WC",
        "LISTE_EQUIPEMENTS",
        "OBSERVATIONS",
      ],
      utilise: faker.number.int({ min: 15, max: 120 }),
    },
    {
      nom: "Contrat de Gestion Locative",
      description: "Contrat pour la gestion locative de biens immobiliers",
      contenu: `CONTRAT DE GESTION LOCATIVE

Entre :
[PROPRIETAIRE], propriétaire du bien situé à [ADRESSE]
et
[GESTIONNAIRE], société de gestion immobilière

ARTICLE 1 - OBJET
Le propriétaire confie au gestionnaire la gestion locative du bien décrit ci-après.

ARTICLE 2 - DURÉE
Le présent contrat est conclu pour une durée de [DUREE_CONTRAT] mois.

ARTICLE 3 - MISSIONS
Le gestionnaire s'engage à :
- Rechercher des locataires
- Établir les contrats de location
- Gérer les quittances de loyer
- Effectuer les états des lieux
- Gérer l'entretien courant

ARTICLE 4 - HONORAIRES
Les honoraires de gestion sont fixés à [POURCENTAGE_HONORAIRES]% des loyers perçus.`,
      variables: [
        "PROPRIETAIRE",
        "ADRESSE",
        "GESTIONNAIRE",
        "DUREE_CONTRAT",
        "POURCENTAGE_HONORAIRES",
      ],
      utilise: faker.number.int({ min: 3, max: 30 }),
    },
  ];

  for (const contratData of contratsTypes) {
    const user = faker.helpers.arrayElement(professionalUsers);

    await prisma.contratType.create({
      data: {
        ...contratData,
        userId: user.id,
        derniereModification: faker.date.recent({ days: 90 }),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 }),
      },
    });
  }

  console.log(`✅ ${contratsTypes.length} contrats types créés`);

  // 3. Seed des Archives de Documents Signés
  console.log("📁 Création des archives signées...");

  const archives = [];
  for (let i = 0; i < 20; i++) {
    const user = faker.helpers.arrayElement(professionalUsers);
    const type = faker.helpers.arrayElement([
      "CONTRAT",
      "COMPROMIS",
      "BAIL",
      "MANDAT",
    ]);

    const nomsArchives = {
      CONTRAT: ["Contrat de vente définitif", "Acte de vente authentique"],
      COMPROMIS: ["Compromis de vente signé", "Promesse de vente"],
      BAIL: ["Bail commercial signé", "Contrat de location authentique"],
      MANDAT: ["Mandat de vente signé", "Mandat de gestion signé"],
    };

    const archive = {
      nom: `${faker.helpers.arrayElement(nomsArchives[type])} - ${faker.location.street()}`,
      type,
      dateSignature: faker.date.past({ years: 1 }),
      parties: [faker.person.fullName(), faker.person.fullName()],
      bien: `${faker.location.streetAddress()}, ${faker.location.city()}`,
      reference: `ARCH-${faker.string.alphanumeric(8).toUpperCase()}`,
      url: faker.helpers.arrayElement(DOCUMENT_IMAGES),
      statut: "SIGNÉ",
      userId: user.id,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 60 }),
    };

    archives.push(archive);
  }

  // Insérer les archives
  for (const archive of archives) {
    await prisma.documentArchive.create({
      data: archive,
    });
  }

  console.log(`✅ ${archives.length} archives créées`);

  console.log("🎉 Seeding des documents terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
