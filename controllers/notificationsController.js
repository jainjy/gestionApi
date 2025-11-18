const { prisma } = require('../lib/db');

// const getNotificationsForUser = async (req, res) => {
//     try {
//         const { userId } = req.params;
        
//         // Récupérer les demandes de l'utilisateur avec statut validé ou refusé
//         const demandes = await prisma.demande.findMany({
//             where: {
//                 createdById: userId,
//                 statut: {
//                     in: ['validée', 'refusée', 'validee']
//                 },
//                 propertyId: {
//                     not: null
//                 }
//             },
//             include: {
//                 property: true
//             },
//             orderBy: {
//                 createdAt: 'desc'
//             }
//         });

//         // Transformer les demandes en notifications
//         const notifications = demandes.map(demande => {
//             const statusText = demande.statut === 'refusée' ? 'refusée' : 'validée';
//             const propertyTitle = demande.property?.title || 'Bien immobilier';
            
//             return {
//                 id: demande.id,
//                 titre: `Demande ${statusText} pour: ${propertyTitle}`,
//                 statut: demande.statut,
//                 propertyId: demande.propertyId,
//                 createdAt: demande.createdAt,
//                 isRead: demande.isRead,
//                 type: 'demande_immobilier'
//             };
//         });

//         const unreadCount = notifications.filter(n => !n.isRead).length;

//         res.json({ notifications, unreadCount });
//     } catch (error) {
//         console.error('Erreur lors de la récupération des notifications:', error);
//         res.status(500).json({ error: 'Erreur serveur' });
//     }
// };

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

        // Récupérer les notifications de la table Notification
        const notificationsFromTable = await prisma.notification.findMany({
            where: {
                OR: [
                    { userProprietaireId: userId },
                    { userId: userId }
                ]
            },
            include: {
                userProprietaire: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
                // Supprimer property et demande si ces relations n'existent pas
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transformer les demandes en notifications
        const demandeNotifications = demandes.map(demande => {
            const statusText = demande.statut === 'refusée' ? 'refusée' : 'validée';
            const propertyTitle = demande.property?.title || 'Bien immobilier';
            
            return {
                id: `demande_${demande.id}`,
                titre: `Demande ${statusText} pour: ${propertyTitle}`,
                statut: demande.statut,
                propertyId: demande.propertyId,
                createdAt: demande.createdAt,
                isRead: demande.isRead,
                type: 'demande_immobilier',
                source: 'demande'
            };
        });

        // Transformer les notifications de la table Notification
        const tableNotifications = notificationsFromTable.map(notif => {
            return {
                id: `notification_${notif.id}`,
                titre: notif.titre || 'Nouvelle notification',
                message: notif.message,
                statut: notif.statut,
                // Ces champs peuvent ne pas exister dans votre modèle Notification
                // propertyId: notif.propertyId,
                // demandeId: notif.demandeId,
                createdAt: notif.createdAt,
                isRead: notif.isRead,
                type: notif.type || 'general',
                source: 'notification_table',
                userProprietaire: notif.userProprietaire
            };
        });

        // Fusionner les deux types de notifications
        const allNotifications = [...tableNotifications, ...demandeNotifications]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const unreadCount = allNotifications.filter(n => !n.isRead).length;

        res.json({ 
            notifications: allNotifications, 
            unreadCount,
            counts: {
                total: allNotifications.length,
                fromTable: tableNotifications.length,
                fromDemandes: demandeNotifications.length,
                unread: unreadCount
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const { userId, notificationId } = req.params;

        // Vérifier si c'est une notification de la table ou une demande
        if (notificationId.startsWith('notification_')) {
            const realId = notificationId.replace('notification_', '');
            
            await prisma.notification.updateMany({
                where: {
                    id: realId,
                    OR: [
                        { userProprietaireId: userId },
                        { userId: userId }
                    ]
                },
                data: {
                    isRead: true
                }
            });
        } else if (notificationId.startsWith('demande_')) {
            const realId = notificationId.replace('demande_', '');
            
            await prisma.demande.updateMany({
                where: {
                    id: realId,
                    createdById: userId
                },
                data: {
                    isRead: true
                }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const markNotificationAsUnread = async (req, res) => {
    try {
        const { userId, notificationId } = req.params;

        if (notificationId.startsWith('notification_')) {
            const realId = notificationId.replace('notification_', '');
            
            await prisma.notification.updateMany({
                where: {
                    id: realId,
                    OR: [
                        { userProprietaireId: userId },
                        { userId: userId }
                    ]
                },
                data: {
                    isRead: false
                }
            });
        } else if (notificationId.startsWith('demande_')) {
            const realId = notificationId.replace('demande_', '');
            
            await prisma.demande.updateMany({
                where: {
                    id: realId,
                    createdById: userId
                },
                data: {
                    isRead: false
                }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors du marquage comme non lu:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const clearAllNotifications = async (req, res) => {
    try {
        const { userId } = req.params;

        // Marquer toutes les notifications de la table comme lues
        await prisma.notification.updateMany({
            where: {
                OR: [
                    { userProprietaireId: userId },
                    { userId: userId }
                ]
            },
            data: {
                isRead: true
            }
        });

        // Marquer toutes les demandes comme lues
        await prisma.demande.updateMany({
            where: {
                createdById: userId
            },
            data: {
                isRead: true
            }
        });

        res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (error) {
        console.error('Erreur lors de la suppression des notifications:', error);
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

// const clearAllNotifications = async (req, res) => {
//     try {
//         const { userId } = req.params;
        
//         await prisma.demande.updateMany({
//             where: {
//                 createdById: userId,
//                 statut: {
//                     in: ['validée', 'refusée', 'validee']
//                 }
//             },
//             data: { 
//                 statut: 'archivee'  // On marque comme archivée au lieu de supprimer
//             }
//         });

//         res.json({ success: true });
//     } catch (error) {
//         console.error('Erreur lors de la suppression des notifications:', error);
//         res.status(500).json({ error: 'Erreur serveur' });
//     }
// };

module.exports = {
    getNotificationsForUser,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    clearAllNotifications
};