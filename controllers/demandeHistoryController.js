const { prisma } = require('../lib/db');




const getHistoryForDemande = async (req, res) => {
    try {
        const { demandeId } = req.params;
        
        const history = await prisma.demandeHistory.findMany({
            where: {
                demandeId: parseInt(demandeId)
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(history);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getHistoryForUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // D'abord, récupérer toutes les demandes de l'utilisateur
        const demandes = await prisma.demande.findMany({
            where: {
                createdById: userId
            },
            select: {
                id: true
            }
        });

        const demandeIds = demandes.map(d => d.id);

        // Ensuite, récupérer tout l'historique pour ces demandes
        const history = await prisma.demandeHistory.findMany({
            where: {
                demandeId: {
                    in: demandeIds
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(history);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const addHistoryEntry = async (req, res) => {
    try {
        const { demandeId } = req.params;
        const { entry } = req.body;

        if (!entry.title) {
            return res.status(400).json({ error: 'Le titre est requis' });
        }

        const historyEntry = await prisma.demandeHistory.create({
            data: {
                demandeId: parseInt(demandeId),
                title: entry.title,
                message: entry.message,
                snapshot: entry.snapshot ? JSON.stringify(entry.snapshot) : null
            }
        });

        res.json({ success: true, entry: historyEntry });
    } catch (error) {
        console.error('Erreur lors de l\'ajout dans l\'historique:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = {
    getHistoryForDemande,
    getHistoryForUser,
    addHistoryEntry
};