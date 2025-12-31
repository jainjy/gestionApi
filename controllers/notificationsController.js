const { prisma } = require('../lib/db');
const { sendNotification, updateNotificationCount } = require('../lib/socket');

const getNotificationsForUser = async (req, res) => {
    try {
      const { userId } = req.params;

      // VÉRIFICATION : est-ce que je demande MES notifications ?
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          error: "Vous ne pouvez accéder qu'à vos propres notifications",
        });
      }

      // Récupérer les demandes avec statut validé ou refusé
      const demandes = await prisma.demande.findMany({
        where: {
          createdById: userId,
          statut: {
            in: ["validée", "refusée", "validee"],
          },
          propertyId: {
            not: null,
          },
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Récupérer les notifications de la table Notification
      const notificationsFromTable = await prisma.notification.findMany({
        where: {
          OR: [{ userProprietaireId: userId }, { userId: userId }],
        },
        include: {
          userProprietaire: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          // 🔥 SUPPRIMER: La relation property n'existe pas dans le modèle Notification
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log(
        `📊 Demandes trouvées: ${demandes.length}, Notifications table: ${notificationsFromTable.length}`
      );

      // Transformer les demandes en notifications
      const demandeNotifications = demandes.map((demande) => {
        const statusText = demande.statut === "refusée" ? "refusée" : "validée";
        const propertyTitle = demande.property?.title || "Bien immobilier";

        return {
          id: `demande_${demande.id}`,
          titre: `Demande ${statusText}`,
          message: `Votre demande pour "${propertyTitle}" a été ${statusText}`,
          statut: demande.statut,
          propertyId: demande.propertyId,
          createdAt: demande.createdAt,
          updatedAt: demande.updatedAt,
          isRead: demande.isRead || false,
          type: "demande_immobilier",
          source: "demande",
          property: demande.property,
        };
      });

      // Transformer les notifications de la table Notification
      const tableNotifications = notificationsFromTable.map((notif) => {
        return {
          id: `notification_${notif.id}`,
          titre: notif.titre || "Nouvelle notification",
          message: notif.message,
          statut: notif.statut,
          propertyId: notif.propertyId, // Garder propertyId si le champ existe
          createdAt: notif.createdAt,
          updatedAt: notif.updatedAt,
          isRead: notif.isRead,
          type: notif.type || "general",
          source: "system",
          userProprietaire: notif.userProprietaire,
          // 🔥 SUPPRIMER: property n'est pas disponible
        };
      });

      // Fusionner et trier toutes les notifications
      const allNotifications = [
        ...tableNotifications,
        ...demandeNotifications,
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const unreadCount = allNotifications.filter((n) => !n.isRead).length;

      console.log(
        `✅ Notifications totales: ${allNotifications.length}, Non lues: ${unreadCount}`
      );

      res.json({
        success: true,
        notifications: allNotifications,
        unreadCount,
        metadata: {
          total: allNotifications.length,
          unread: unreadCount,
          fromDemandes: demandeNotifications.length,
          fromSystem: tableNotifications.length,
        },
      });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des notifications:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur serveur lors de la récupération des notifications',
            details: error.message
        });
    }
};

const markAsRead = async (req, res) => {
    try {
      const { userId, notificationId } = req.params;
      // VÉRIFICATION : est-ce que je demande MES notifications ?
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          error: "Vous ne pouvez accéder qu'à vos propres notifications",
        });
      }
      const notifId = parseInt(notificationId.replace("notification_", ""));

      await prisma.notification.updateMany({
        where: {
          id: notifId,
          OR: [{ userId }, { userProprietaireId: userId }],
        },
        data: { read: true },
      });

      const unreadCount = await getUnreadCount(userId);
      await updateNotificationCount(userId, unreadCount);

      res.json({ success: true, message: "Notification marquée comme lue" });
    } catch (error) {
        console.error("❌ markAsRead:", error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
};


const markAsUnread = async (req, res) => {
    try {
      const { userId, notificationId } = req.params;

      // VÉRIFICATION : est-ce que je demande MES notifications ?
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          error: "Vous ne pouvez accéder qu'à vos propres notifications",
        });
      }

      const notifId = parseInt(notificationId.replace("notification_", ""));

      await prisma.notification.updateMany({
        where: {
          id: notifId,
          OR: [{ userId }, { userProprietaireId: userId }],
        },
        data: { read: false },
      });

      const unreadCount = await getUnreadCount(userId);
      await updateNotificationCount(userId, unreadCount);

      res.json({
        success: true,
        message: "Notification marquée comme non lue",
      });
    } catch (error) {
        console.error("❌ markAsUnread:", error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
};


const markAllAsRead = async (req, res) => {
    try {
      const { userId } = req.params;

      // VÉRIFICATION : est-ce que je demande MES notifications ?
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          error: "Vous ne pouvez accéder qu'à vos propres notifications",
        });
      }

      await prisma.notification.updateMany({
        where: {
          read: false,
          OR: [{ userId }, { userProprietaireId: userId }],
        },
        data: { read: true },
      });

      await updateNotificationCount(userId, 0);

      res.json({
        success: true,
        message: "Toutes les notifications sont lues",
      });
    } catch (error) {
        console.error("❌ markAllAsRead:", error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
};

const deleteNotification = async (req, res) => {
    try {
      const { userId, notificationId } = req.params;

      // VÉRIFICATION : est-ce que je demande MES notifications ?
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          error: "Vous ne pouvez accéder qu'à vos propres notifications",
        });
      }

      if (notificationId.startsWith("demande_")) {
        // Pour les demandes, on ne supprime pas, on marque juste comme archivée
        const demandeId = parseInt(notificationId.replace("demande_", ""));
        await prisma.demande.update({
          where: {
            id: demandeId,
            createdById: userId,
          },
          data: { statut: "archivee" },
        });
      } else if (notificationId.startsWith("notification_")) {
        const notifId = parseInt(notificationId.replace("notification_", ""));
        await prisma.notification.delete({
          where: {
            id: notifId,
            OR: [{ userProprietaireId: userId }, { userId: userId }],
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          error: "Format ID de notification invalide",
        });
      }

      // Recharger le compteur
      const unreadCount = await getUnreadCount(userId);
      await updateNotificationCount(userId, unreadCount);

      res.json({
        success: true,
        message: "Notification supprimée",
      });
    } catch (error) {
        console.error('❌ Erreur suppression notification:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur serveur lors de la suppression' 
        });
    }
};

const clearAllNotifications = async (req, res) => {
    try {
      const { userId } = req.params;

      // VÉRIFICATION : est-ce que je demande MES notifications ?
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          error: "Vous ne pouvez accéder qu'à vos propres notifications",
        });
      }

      // Supprimer toutes les notifications de la table
      await prisma.notification.deleteMany({
        where: {
          OR: [{ userProprietaireId: userId }, { userId: userId }],
        },
      });

      // Marquer toutes les demandes comme archivées
      await prisma.demande.updateMany({
        where: {
          createdById: userId,
          statut: {
            in: ["validée", "refusée", "validee"],
          },
        },
        data: {
          statut: "archivee",
        },
      });

      // Mettre à jour le compteur via WebSocket
      await updateNotificationCount(userId, 0);

      console.log(
        `✅ Toutes les notifications supprimées pour user: ${userId}`
      );

      res.json({
        success: true,
        message: "Toutes les notifications ont été supprimées",
      });
    } catch (error) {
        console.error('❌ Erreur suppression totale:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur serveur' 
        });
    }
};

// Fonction utilitaire pour obtenir le nombre de notifications non lues
// const getUnreadCount = async (userId) => {
//     try {
//         const demandesCount = await prisma.demande.count({
//             where: {
//                 createdById: userId,
//                 statut: { in: ['validée', 'refusée', 'validee'] },
//                 propertyId: { not: null },
//                 isRead: false
//             }
//         });

//         const notificationsCount = await prisma.notification.count({
//             where: {
//                 OR: [
//                     { userProprietaireId: userId },
//                     { userId: userId }
//                 ],
//                 isRead: false
//             }
//         });

//         return demandesCount + notificationsCount;
//     } catch (error) {
//         console.error('❌ Erreur calcul compteur non lus:', error);
//         return 0;
//     }
// };

const getUnreadCount = async (userId) => {
    try {
        
        const demandesCount = await prisma.demande.count({
            where: {
                createdById: userId,
                statut: { in: ['validée', 'refusée', 'validee'] },
                propertyId: { not: null },
                isRead: false   // ⚠ OK pour la table demande (elle utilise isRead)
            }
        });

        const notificationsCount = await prisma.notification.count({
            where: {
                OR: [
                    { userProprietaireId: userId },
                    { userId: userId }
                ],
                read: false  // 🔥 CORRECT (champ exact dans Notification)
            }
        });

        return demandesCount + notificationsCount;
    } catch (error) {
        console.error('❌ Erreur calcul compteur non lus:', error);
        return 0;
    }
};


// Fonction pour créer une nouvelle notification
const createNotification = async (req, res) => {
    try {
        const { userId, titre, message, type, userProprietaireId, propertyId } = req.body;

        console.log(`📨 Création notification: ${titre} pour user: ${userProprietaireId || userId}`);

        const notification = await prisma.notification.create({
            data: {
                titre,
                message,
                type: type || 'general',
                userProprietaireId: userProprietaireId || userId,
                userId: userProprietaireId ? userId : null,
                propertyId: propertyId || null,
                isRead: false
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
                // 🔥 SUPPRIMER: property n'est pas disponible dans l'include
            }
        });

        // Envoyer la notification en temps réel via WebSocket
        const notificationData = {
            id: `notification_${notification.id}`,
            titre: notification.titre,
            message: notification.message,
            type: notification.type,
            propertyId: notification.propertyId,
            createdAt: notification.createdAt,
            isRead: false,
            source: 'system'
        };

        // Envoyer à l'utilisateur propriétaire
        const targetUserId = notification.userProprietaireId || userId;
        if (targetUserId) {
            await sendNotification(targetUserId, notificationData);
            
            // Mettre à jour le compteur
            const unreadCount = await getUnreadCount(targetUserId);
            await updateNotificationCount(targetUserId, unreadCount);
        }

        console.log(`✅ Notification créée: ${notification.id}`);

        res.status(201).json({
            success: true,
            notification: notificationData
        });
    } catch (error) {
        console.error('❌ Erreur création notification:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur serveur lors de la création' 
        });
    }
};

module.exports = {
    getNotificationsForUser,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    createNotification,
    getUnreadCount
};