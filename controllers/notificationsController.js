const { prisma } = require('../lib/db');

const getNotificationsForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Récupérer les demandes de l'utilisateur avec statut validé ou refusé
        const demandes = await prisma.demande.findMany({
            where: {
                createdById: userId,
                statut: {
                    in: ['validée', 'refusée', 'validee']
                },
                propertyId: {
                    not: null
                }
            },
            include: {
                property: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transformer les demandes en notifications
        const notifications = demandes.map(demande => {
            const statusText = demande.statut === 'refusée' ? 'refusée' : 'validée';
            const propertyTitle = demande.property?.title || 'Bien immobilier';
            
            return {
                id: demande.id,
                titre: `Demande ${statusText} pour: ${propertyTitle}`,
                statut: demande.statut,
                propertyId: demande.propertyId,
                createdAt: demande.createdAt,
                isRead: demande.isRead,
                type: 'demande_immobilier'
            };
        });

        const unreadCount = notifications.filter(n => !n.isRead).length;

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { userId, notificationId } = req.params;
        
        const demande = await prisma.demande.findFirst({
            where: {
                id: parseInt(notificationId),
                createdById: userId
            }
        });

        if (!demande) {
            return res.status(404).json({ error: 'Notification non trouvée' });
        }

        await prisma.demande.update({
            where: { id: parseInt(notificationId) },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const markAsUnread = async (req, res) => {
    try {
        const { userId, notificationId } = req.params;
        
        const demande = await prisma.demande.findFirst({
            where: {
                id: parseInt(notificationId),
                createdById: userId
            }
        });

        if (!demande) {
            return res.status(404).json({ error: 'Notification non trouvée' });
        }

        await prisma.demande.update({
            where: { id: parseInt(notificationId) },
            data: { isRead: false }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors du marquage comme non lu:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.params;
        
        await prisma.demande.updateMany({
            where: {
                createdById: userId,
                statut: {
                    in: ['validée', 'refusée', 'validee']
                },
                propertyId: {
                    not: null
                },
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const clearAllNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        
        await prisma.demande.updateMany({
            where: {
                createdById: userId,
                statut: {
                    in: ['validée', 'refusée', 'validee']
                }
            },
            data: { 
                statut: 'archivee'  // On marque comme archivée au lieu de supprimer
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la suppression des notifications:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = {
    getNotificationsForUser,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    clearAllNotifications
};