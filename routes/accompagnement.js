// routes/accompagnement.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// routes/accompagnement.js - CORRECTION DE LA ROUTE POST /demande
router.post("/demande", async (req, res) => {
    try {
        const {
            nom,
            email,
            telephone,
            entreprise,
            besoin,
            accompagnementType,
            budget,
            message,
            expertId,
            userId: clientUserId // Récupérer userId du frontend
        } = req.body;

        // Validation
        if (!nom || !email || !besoin || !accompagnementType) {
            return res.status(400).json({
                success: false,
                error: "Les champs nom, email, besoin et type d'accompagnement sont requis"
            });
        }

        // Vérifier si l'utilisateur est authentifié via le token
        let authenticatedUserId = null;
        let user = null;

        if (req.user?.id) {
            // Utilisateur connecté via token JWT
            authenticatedUserId = req.user.id;

            // Récupérer les informations complètes de l'utilisateur
            user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    companyName: true
                }
            });

            if (user) {
                // Pré-remplir avec les données utilisateur si manquantes
                req.body.nom = req.body.nom || `${user.firstName} ${user.lastName}`;
                req.body.email = req.body.email || user.email;
                req.body.telephone = req.body.telephone || user.phone;
                req.body.entreprise = req.body.entreprise || user.companyName;
            }
        }

        // Déterminer le userId final (priorité à l'utilisateur connecté via token)
        let finalUserId = authenticatedUserId || clientUserId || null; // <-- CHANGÉ 'const' en 'let'

        // Vérifier si l'email existe déjà dans la base (pour lier à un utilisateur existant non connecté)
        if (!authenticatedUserId && email) {
            const existingUser = await prisma.user.findUnique({
                where: { email: email }
            });

            if (existingUser) {
                finalUserId = existingUser.id; // <-- MAINTENANT POSSIBLE CAR finalUserId EST 'let'
            }
        }

        // Préparer les données pour la création
        const demandeData = {
            conseilType: accompagnementType,
            besoin: besoin,
            budget: budget || "surdevis",
            message: message || "",
            nom: nom,
            email: email,
            telephone: telephone || "",
            entreprise: entreprise || "",
            statut: "en_attente",
            origine: "page_accompagnement"
        };

        // Ajouter userId uniquement s'il existe
        if (finalUserId) {
            demandeData.userId = finalUserId;
        }

        // Ajouter expertId si spécifié
        if (expertId) {
            demandeData.expertId = expertId;
        }

        // Créer la demande d'accompagnement
        const demandeAccompagnement = await prisma.demandeConseil.create({
            data: demandeData,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                expert: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        // Créer une notification pour l'expert si assigné
        if (expertId) {
            await prisma.notification.create({
                data: {
                    type: "demande_accompagnement",
                    title: "Nouvelle demande d'accompagnement",
                    message: `${nom} a demandé un accompagnement "${accompagnementType}"`,
                    relatedEntity: "demandeConseil",
                    relatedEntityId: String(demandeAccompagnement.id),
                    userId: expertId,
                    read: false
                }
            });
        }

        // Notification pour l'admin
        await prisma.notification.create({
            data: {
                type: "demande_accompagnement",
                title: "Nouvelle demande d'accompagnement",
                message: `Nouvelle demande: ${accompagnementType} de ${nom}`,
                relatedEntity: "demandeConseil",
                relatedEntityId: String(demandeAccompagnement.id),
                userProprietaireId: null,
                read: false
            }
        });

        // Si l'utilisateur n'était pas connecté mais a fourni un email,
        // envoyer un email de confirmation
        if (!authenticatedUserId && email) {
            try {
                // Vous pouvez ajouter ici l'envoi d'email
                // await sendConfirmationEmail(email, nom, accompagnementType);
                console.log(`📧 Email de confirmation à envoyer pour ${email}`);
            } catch (emailError) {
                console.error("❌ Erreur envoi email confirmation:", emailError);
                // Ne pas bloquer la création de la demande
            }
        }

        res.status(201).json({
            success: true,
            message: "Votre demande d'accompagnement a été envoyée avec succès",
            data: demandeAccompagnement
        });

    } catch (error) {
        console.error("❌ Erreur création demande accompagnement:", error);

        // Message d'erreur plus détaillé selon le type d'erreur
        let errorMessage = "Erreur lors de l'envoi de la demande";

        if (error.message.includes("Argument `user` is missing")) {
            errorMessage = "Erreur de configuration de la base de données : le champ 'user' est requis";
        } else if (error.code === 'P2002') {
            errorMessage = "Une demande similaire existe déjà";
        } else if (error.code === 'P2003') {
            errorMessage = "Référence d'expert ou d'utilisateur invalide";
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
/**
 * @route GET /api/accompagnement/types
 * @description Récupérer les types d'accompagnement disponibles
 * @access Public
 */
router.get("/types", async (req, res) => {
    try {
        // Récupérer depuis la base de données ou utiliser des valeurs par défaut
        const types = await prisma.conseilType.findMany({
            where: { isActive: true },
            orderBy: { ordre: "asc" }
        });

        // Si aucun type en base, utiliser les valeurs par défaut
        if (types.length === 0) {
            const defaultTypes = [
                {
                    id: 1,
                    title: "Accompagnement Création",
                    description: "De l'idée à la création de votre entreprise",
                    category: "creation",
                    duration: "3-6 mois",
                    price: "À partir de 1 500€",
                    icon: "Rocket",
                    color: "#6B8E23",
                    details: JSON.stringify([
                        "Étude de faisabilité complète",
                        "Business plan détaillé",
                        "Choix de la structure juridique",
                        "Formalités d'immatriculation",
                        "Aides et subventions"
                    ]),
                    isFeatured: true,
                    isPopular: false
                },
                {
                    id: 2,
                    title: "Accompagnement Croissance",
                    description: "Développez et optimisez votre entreprise existante",
                    category: "croissance",
                    duration: "6-12 mois",
                    price: "À partir de 2 500€",
                    icon: "TrendingUp",
                    color: "#27AE60",
                    details: JSON.stringify([
                        "Stratégie de développement",
                        "Optimisation des processus",
                        "Analyse de marché",
                        "Plan de croissance",
                        "Recrutement stratégique"
                    ]),
                    isFeatured: false,
                    isPopular: true
                },
                {
                    id: 3,
                    title: "Transition & Transmission",
                    description: "Préparez la transmission ou la cession de votre entreprise",
                    category: "transition",
                    duration: "12-24 mois",
                    price: "Sur devis personnalisé",
                    icon: "Handshake",
                    color: "#8B4513",
                    details: JSON.stringify([
                        "Évaluation de l'entreprise",
                        "Préparation à la transmission",
                        "Recherche d'acquéreurs",
                        "Négociation",
                        "Accompagnement juridique"
                    ]),
                    isFeatured: false,
                    isPopular: false
                },
                {
                    id: 4,
                    title: "Expertise Comptable & Fiscale",
                    description: "Optimisez votre gestion comptable et fiscale",
                    category: "expertise",
                    duration: "Continu ou ponctuel",
                    price: "À partir de 300€/mois",
                    icon: "PieChart",
                    color: "#2C3E50",
                    details: JSON.stringify([
                        "Tenue de comptabilité",
                        "Optimisation fiscale",
                        "Déclarations sociales",
                        "Audit comptable",
                        "Conseil en gestion"
                    ]),
                    isFeatured: false,
                    isPopular: false
                },
                {
                    id: 5,
                    title: "Stratégie Marketing & Digital",
                    description: "Développez votre présence en ligne et votre clientèle",
                    category: "croissance",
                    duration: "3-12 mois",
                    price: "À partir de 1 800€",
                    icon: "Target",
                    color: "#D4AF37",
                    details: JSON.stringify([
                        "Stratégie marketing digitale",
                        "Branding et identité visuelle",
                        "Référencement SEO",
                        "Campagnes publicitaires",
                        "Analyse des performances"
                    ]),
                    isFeatured: false,
                    isPopular: false
                },
                {
                    id: 6,
                    title: "Financement & Levée de Fonds",
                    description: "Accédez aux financements adaptés à votre projet",
                    category: "croissance",
                    duration: "2-6 mois",
                    price: "5% des fonds levés (min. 2 000€)",
                    icon: "Coins",
                    color: "#F39C12",
                    details: JSON.stringify([
                        "Préparation du dossier financier",
                        "Recherche d'investisseurs",
                        "Négociation avec les banques",
                        "Subventions et aides",
                        "Business angels & VC"
                    ]),
                    isFeatured: false,
                    isPopular: false
                }
            ];

            // Formater pour la réponse
            const formattedTypes = defaultTypes.map(type => ({
                ...type,
                details: JSON.parse(type.details)
            }));

            return res.json({
                success: true,
                data: formattedTypes
            });
        }

        // Formater les types de la base de données
        const formattedTypes = types.map(type => ({
            ...type,
            details: type.details ? JSON.parse(type.details) : []
        }));

        res.json({
            success: true,
            data: formattedTypes
        });

    } catch (error) {
        console.error("❌ Erreur récupération types accompagnement:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des types d'accompagnement"
        });
    }
});

/**
 * @route GET /api/accompagnement/experts
 * @description Récupérer la liste des experts
 * @access Public
 */
router.get("/experts", async (req, res) => {
    try {
        const experts = await prisma.user.findMany({
            where: {
                OR: [
                    { role: "expert" },
                    { userType: "professional" },
                    { metiers: { some: {} } }
                ],
                status: "active"
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                companyName: true,
                avatar: true,
                userType: true,
                role: true,
                commercialName: true,
                createdAt: true,
                metiers: {
                    include: {
                        metier: true
                    }
                },
                services: {
                    include: {
                        service: true
                    }
                },
                _count: {
                    select: {
                        expertDemandesConseil: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Fonction pour calculer le rating d'un expert
        const calculateExpertRating = (expert) => {
            let rating = 4.0;

            const totalDemandes = expert._count?.expertDemandesConseil || 0;

            if (totalDemandes > 50) rating += 1.0;
            else if (totalDemandes > 20) rating += 0.7;
            else if (totalDemandes > 10) rating += 0.5;
            else if (totalDemandes > 5) rating += 0.3;
            else if (totalDemandes > 0) rating += 0.1;

            if (expert.metiers?.length > 3) rating += 0.4;
            else if (expert.metiers?.length > 1) rating += 0.2;

            if (expert.services?.length > 10) rating += 0.3;
            else if (expert.services?.length > 5) rating += 0.2;
            else if (expert.services?.length > 2) rating += 0.1;

            if (expert.createdAt) {
                const now = new Date();
                const joinDate = new Date(expert.createdAt);
                const yearsSinceJoin = (now - joinDate) / (1000 * 60 * 60 * 24 * 365);

                if (yearsSinceJoin > 5) rating += 0.5;
                else if (yearsSinceJoin > 3) rating += 0.3;
                else if (yearsSinceJoin > 1) rating += 0.2;
            }

            if (expert.role === 'expert') rating += 0.3;

            rating = Math.max(0, Math.min(rating, 5));
            return rating.toFixed(1);
        };

        // Fonction pour calculer la spécialité
        const calculateSpecialty = (expert) => {
            if (expert.metiers && expert.metiers.length > 0) {
                const metier = expert.metiers[0].metier;
                return metier.libelle || "Expert Conseil";
            }

            if (expert.role === 'expert') return "Expert Conseil";
            if (expert.userType === 'professional') return "Professionnel";

            return "Consultant";
        };

        // Fonction pour calculer le titre
        const calculateTitle = (expert) => {
            if (expert.commercialName) return expert.commercialName;
            if (expert.role === 'expert') return 'Expert Conseil';
            if (expert.userType === 'professional') return 'Professionnel';
            return 'Consultant';
        };

        // Fonction pour calculer l'expérience
        const calculateExperience = (expert) => {
            if (expert.createdAt) {
                const now = new Date();
                const joinDate = new Date(expert.createdAt);
                const years = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24 * 365));

                if (years > 10) return "Plus de 10 ans d'expérience";
                if (years > 5) return "5-10 ans d'expérience";
                if (years > 3) return "3-5 ans d'expérience";
                if (years > 1) return "1-3 ans d'expérience";
                return "Moins d'un an d'expérience";
            }
            return "Expérience variable";
        };

        // Fonction pour calculer la disponibilité
        const calculateDisponibilite = (expert) => {
            const totalDemandes = expert._count?.expertDemandesConseil || 0;
            if (totalDemandes < 5) return 'disponible';
            if (totalDemandes < 15) return 'limitee';
            return 'complet';
        };

        // Fonction pour générer une couleur d'avatar
        const generateAvatarColor = (id) => {
            const colors = [
                "#6B8E23", "#8B4513", "#556B2F", "#2C3E50",
                "#27AE60", "#D4AF37", "#8FBC8F", "#A0522D"
            ];
            const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return colors[index % colors.length];
        };

        // Enrichir les données
        const expertsEnriched = experts.map(expert => {
            const rating = calculateExpertRating(expert);
            const experience = calculateExperience(expert);
            const disponibilite = calculateDisponibilite(expert);
            const avatarColor = generateAvatarColor(expert.id);

            return {
                id: expert.id,
                name: `${expert.firstName || ''} ${expert.lastName || ''}`.trim() || 'Expert',
                title: calculateTitle(expert),
                specialty: calculateSpecialty(expert),
                experience: experience,
                rating: parseFloat(rating),
                avatarColor: avatarColor,
                disponibilite: disponibilite,
                projects: expert._count?.expertDemandesConseil || 0,
                avatar: expert.avatar,
                companyName: expert.companyName,
                metiers: expert.metiers.map(m => m.metier.libelle),
                services: expert.services.map(s => s.service.libelle)
            };
        });

        // Trier par rating (décroissant)
        expertsEnriched.sort((a, b) => b.rating - a.rating);

        res.json({
            success: true,
            data: expertsEnriched
        });

    } catch (error) {
        console.error("❌ Erreur récupération experts:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des experts",
            details: error.message
        });
    }
});

/**
 * @route GET /api/accompagnement/stats
 * @description Récupérer les statistiques
 * @access Public
 */
router.get("/stats", async (req, res) => {
    try {
        const [
            totalDemandes,
            demandesTerminees,
            totalExperts,
            tauxReussite
        ] = await Promise.all([
            prisma.demandeConseil.count(),
            prisma.demandeConseil.count({
                where: { statut: "terminee" }
            }),
            prisma.user.count({
                where: {
                    OR: [
                        { role: "expert" },
                        { userType: "professional" }
                    ],
                    status: "active"
                }
            }),
            // Calcul approximatif du taux de réussite
            (async () => {
                const total = await prisma.demandeConseil.count();
                const terminees = await prisma.demandeConseil.count({
                    where: { statut: "terminee" }
                });
                return total > 0 ? Math.round((terminees / total) * 100) : 95;
            })()
        ]);

        // Données par défaut impressionnantes
        const defaultStats = [
            {
                value: `${tauxReussite}%`,
                label: "Taux de réussite",
                icon: "Trophy",
                color: "#D4AF37"
            },
            {
                value: `${totalDemandes + 500}+`,
                label: "Entreprises accompagnées",
                icon: "Users",
                color: "#6B8E23"
            },
            {
                value: "10",
                label: "Années d'expertise",
                icon: "Award",
                color: "#8B4513"
            },
            {
                value: "24h",
                label: "Réponse garantie",
                icon: "Clock",
                color: "#27AE60"
            }
        ];

        res.json({
            success: true,
            data: defaultStats
        });

    } catch (error) {
        console.error("❌ Erreur récupération stats:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des statistiques"
        });
    }
});

/**
 * @route GET /api/accompagnement/temoignages
 * @description Récupérer les témoignages
 * @access Public
 */
router.get("/temoignages", async (req, res) => {
    try {
        // Dans une vraie application, vous auriez un modèle Témoignage
        // Pour l'instant, retournons des données par défaut
        const defaultTemoignages = [
            {
                id: 1,
                name: "Julie Moreau",
                entreprise: "TechStart Solutions",
                texte: "L'accompagnement a été crucial pour le lancement de ma startup. L'expertise et le réseau mis à disposition ont fait toute la différence.",
                rating: 5,
                date: "15 Jan 2024",
                avatarColor: "#6B8E23",
                resultat: "+200% CA en 18 mois"
            },
            {
                id: 2,
                name: "Marc Lefebvre",
                entreprise: "Artisan & Co",
                texte: "Grâce à l'accompagnement stratégique, nous avons doublé notre chiffre d'affaires en 18 mois. Une équipe exceptionnelle !",
                rating: 5,
                date: "22 Nov 2023",
                avatarColor: "#8B4513",
                resultat: "Doublement du CA"
            },
            {
                id: 3,
                name: "Sarah Chen",
                entreprise: "Green Innovations",
                texte: "La transmission de mon entreprise s'est déroulée parfaitement grâce à leur expertise. Je recommande vivement leurs services.",
                rating: 5,
                date: "5 Oct 2023",
                avatarColor: "#556B2F",
                resultat: "Transmission réussie à 120% valeur"
            }
        ];

        // Si vous avez une table pour les témoignages, utilisez plutôt:
        // const temoignages = await prisma.temoignage.findMany({
        //   where: { isActive: true },
        //   orderBy: { date: "desc" },
        //   take: 6
        // });

        res.json({
            success: true,
            data: defaultTemoignages
        });

    } catch (error) {
        console.error("❌ Erreur récupération témoignages:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des témoignages"
        });
    }
});

/**
 * @route GET /api/accompagnement/etapes
 * @description Récupérer les étapes de l'accompagnement
 * @access Public
 */
router.get("/etapes", async (req, res) => {
    try {
        const etapes = [
            {
                step: 1,
                title: "Diagnostic initial",
                description: "Analyse approfondie de votre situation et définition des objectifs",
                icon: "Search",
                color: "#6B8E23",
                details: "Entretien personnalisé, analyse SWOT, benchmark concurrentiel"
            },
            {
                step: 2,
                title: "Plan d'action",
                description: "Élaboration d'une stratégie sur mesure avec des échéances claires",
                icon: "Target",
                color: "#27AE60",
                details: "Roadmap détaillée, KPIs, planning d'exécution"
            },
            {
                step: 3,
                title: "Mise en œuvre",
                description: "Accompagnement pas à pas dans la réalisation de votre projet",
                icon: "Rocket",
                color: "#8B4513",
                details: "Suivi hebdomadaire, ajustements, reporting régulier"
            },
            {
                step: 4,
                title: "Suivi & Ajustements",
                description: "Réajustements réguliers pour garantir l'atteinte des objectifs",
                icon: "TrendingUp",
                color: "#D4AF37",
                details: "Analyse des résultats, optimisation continue"
            },
            {
                step: 5,
                title: "Capitalisation",
                description: "Transfert de compétences et autonomisation pour l'avenir",
                icon: "GraduationCap",
                color: "#2C3E50",
                details: "Formation de l'équipe, documentation, support post-accompagnement"
            }
        ];

        res.json({
            success: true,
            data: etapes
        });

    } catch (error) {
        console.error("❌ Erreur récupération étapes:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des étapes"
        });
    }
});

/**
 * @route GET /api/accompagnement/avantages
 * @description Récupérer les avantages
 * @access Public
 */
router.get("/avantages", async (req, res) => {
    try {
        const avantages = [
            {
                title: "Expertise certifiée",
                description: "Nos experts sont certifiés et possèdent une expérience avérée",
                icon: "ShieldCheck",
                color: "#6B8E23"
            },
            {
                title: "Approche personnalisée",
                description: "Chaque accompagnement est adapté à vos besoins spécifiques",
                icon: "HeartHandshake",
                color: "#27AE60"
            },
            {
                title: "Résultats mesurables",
                description: "Des objectifs clairs avec des indicateurs de performance",
                icon: "BarChart",
                color: "#8B4513"
            },
            {
                title: "Réseau exclusif",
                description: "Accès à notre réseau de partenaires et investisseurs",
                icon: "Globe",
                color: "#D4AF37"
            }
        ];

        res.json({
            success: true,
            data: avantages
        });

    } catch (error) {
        console.error("❌ Erreur récupération avantages:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des avantages"
        });
    }
});

/**
 * @route GET /api/accompagnement/mes-demandes
 * @description Récupérer les demandes de l'utilisateur connecté
 * @access Private
 */
router.get("/mes-demandes", authenticateToken, async (req, res) => {
    try {
        const demandes = await prisma.demandeConseil.findMany({
            where: {
                OR: [
                    { userId: req.user.id },
                    { email: req.user.email }
                ]
            },
            include: {
                expert: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true
                    }
                },
                suivis: {
                    orderBy: { createdAt: "desc" },
                    take: 5
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.json({
            success: true,
            data: demandes
        });

    } catch (error) {
        console.error("❌ Erreur récupération demandes:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération de vos demandes"
        });
    }
});

/**
 * @route GET /api/accompagnement/demande/:id
 * @description Récupérer une demande spécifique
 * @access Private
 */
router.get("/demande/:id", authenticateToken, async (req, res) => {
    try {
        const demande = await prisma.demandeConseil.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                },
                expert: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true
                    }
                },
                suivis: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });

        if (!demande) {
            return res.status(404).json({
                success: false,
                error: "Demande non trouvée"
            });
        }

        // Vérifier que l'utilisateur a accès à cette demande
        if (demande.userId !== req.user.id && demande.expertId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: "Non autorisé à voir cette demande"
            });
        }

        res.json({
            success: true,
            data: demande
        });

    } catch (error) {
        console.error("❌ Erreur récupération demande:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération de la demande"
        });
    }
});

/**
 * @route POST /api/accompagnement/demande/:id/suivi
 * @description Ajouter un suivi à une demande
 * @access Private
 */
router.post("/demande/:id/suivi", authenticateToken, async (req, res) => {
    try {
        const { message, type, rendezVous } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: "Un message est requis pour le suivi"
            });
        }

        const demande = await prisma.demandeConseil.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!demande) {
            return res.status(404).json({
                success: false,
                error: "Demande non trouvée"
            });
        }

        // Vérifier que l'utilisateur a accès à cette demande
        if (demande.userId !== req.user.id && demande.expertId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: "Non autorisé à modifier cette demande"
            });
        }

        const suivi = await prisma.suiviConseil.create({
            data: {
                demandeConseilId: parseInt(req.params.id),
                userId: req.user.id,
                message,
                type: type || "message",
                rendezVous: rendezVous ? new Date(rendezVous) : null
            }
        });

        // Mettre à jour la date de modification de la demande
        await prisma.demandeConseil.update({
            where: { id: parseInt(req.params.id) },
            data: { updatedAt: new Date() }
        });

        res.json({
            success: true,
            message: "Suivi ajouté avec succès",
            data: suivi
        });

    } catch (error) {
        console.error("❌ Erreur ajout suivi:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'ajout du suivi"
        });
    }
});

/**
 * @route PUT /api/accompagnement/demande/:id/statut
 * @description Mettre à jour le statut d'une demande
 * @access Private
 */
router.put("/demande/:id/statut", authenticateToken, async (req, res) => {
    try {
        const { statut } = req.body;

        if (!statut) {
            return res.status(400).json({
                success: false,
                error: "Le statut est requis"
            });
        }

        const demande = await prisma.demandeConseil.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!demande) {
            return res.status(404).json({
                success: false,
                error: "Demande non trouvée"
            });
        }

        // Vérifier les autorisations
        if (demande.userId !== req.user.id && demande.expertId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: "Non autorisé à modifier cette demande"
            });
        }

        const demandeMiseAJour = await prisma.demandeConseil.update({
            where: { id: parseInt(req.params.id) },
            data: { statut, updatedAt: new Date() },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                expert: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        // Ajouter un suivi automatique
        await prisma.suiviConseil.create({
            data: {
                demandeConseilId: parseInt(req.params.id),
                userId: req.user.id,
                message: `Statut changé à: ${statut}`,
                type: "message"
            }
        });

        res.json({
            success: true,
            message: "Statut mis à jour avec succès",
            data: demandeMiseAJour
        });

    } catch (error) {
        console.error("❌ Erreur mise à jour statut:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la mise à jour du statut"
        });
    }
});
// routes/accompagnement.js - AJOUTER CETTE ROUTE
/**
 * @route GET /api/accompagnement/user-info
 * @description Récupérer les informations de l'utilisateur connecté
 * @access Private
 */
router.get("/user-info", authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                companyName: true,
                address: true,
                city: true,
                zipCode: true,
                commercialName: true,
                websiteUrl: true,
                avatar: true,
                role: true,
                userType: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "Utilisateur non trouvé"
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error("❌ Erreur récupération info utilisateur:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des informations"
        });
    }
});


module.exports = router;