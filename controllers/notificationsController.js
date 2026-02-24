const { prisma } = require('../lib/db');
const { sendNotification, updateNotificationCount } = require('../lib/socket');

const getNotificationsForUser = async (req, res) => {
    try {
      const { userId } = req.params;

      console.log('===========================================');
      console.log('👤 RÉCUPÉRATION NOTIFICATIONS - DÉBUT');
      console.log('👤 userId demandé:', userId);
      console.log('👤 utilisateur connecté (req.user.id):', req.user.id);
      console.log('👤 rôle utilisateur:', req.user.role);

      // VÉRIFICATION STRICTE : l'utilisateur ne peut voir que SES notifications
      if (req.user.id !== userId && req.user.role !== "admin") {
        console.log('❌ ACCÈS NON AUTORISÉ - userId différent');
        return res.status(403).json({
          error: "Vous ne pouvez accéder qu'à vos propres notifications",
        });
      }

      console.log('✅ ACCÈS AUTORISÉ');

      // Récupérer les demandes créées par CET utilisateur
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

      console.log(`📊 Demandes trouvées pour user ${userId}: ${demandes.length}`);

      // Récupérer les notifications de la table Notification
      const notificationsFromTable = await prisma.notification.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log(`📊 Notifications table pour user ${userId}: ${notificationsFromTable.length}`);

      // Afficher le détail des notifications trouvées
      if (notificationsFromTable.length > 0) {
        console.log('📋 Détail des notifications:');
        notificationsFromTable.forEach((notif, index) => {
          console.log(`  [${index + 1}] ID: ${notif.id}, userId: ${notif.userId}, title: ${notif.title}, read: ${notif.read}`);
        });
      }

      // Transformer les demandes en notifications
      const demandeNotifications = demandes.map((demande) => {
        const statusText = demande.statut === "refusée" ? "refusée" : "validée";
        const propertyTitle = demande.property?.title || "Bien immobilier";

        return {
          id: `demande_${demande.id}`,
          title: `Demande ${statusText}`,
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
          title: notif.title || "Nouvelle notification",
          message: notif.message,
          statut: notif.statut,
          propertyId: notif.propertyId,
          createdAt: notif.createdAt,
          updatedAt: notif.updatedAt,
          isRead: notif.read,
          type: notif.type || "general",
          source: "system",
        };
      });

      // Fusionner et trier toutes les notifications
      const allNotifications = [
        ...tableNotifications,
        ...demandeNotifications,
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const unreadCount = allNotifications.filter((n) => !n.isRead).length;

      console.log(`✅ TOTAL pour user ${userId}: ${allNotifications.length} notifications (${unreadCount} non lues)`);
      console.log('===========================================');

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
        console.error('===========================================');
        console.error('❌ Erreur lors de la récupération des notifications:', error);
        console.error('❌ Message:', error.message);
        console.error('❌ Stack:', error.stack);
        console.error('===========================================');
        
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

const createNotification = async (req, res) => {
    try {
        const { userId, title, message, type, propertyId } = req.body;

        console.log(`📨 Création notification: ${title} pour user: ${userId}`);

        // ✅ Version simplifiée - utilise seulement userId
        const notification = await prisma.notification.create({
            data: {
                title,
                message,
                type: type || 'general',
                read: false,
                userId: userId,  // Utilisez le champ direct
                // OU si vous préférez la syntaxe connect :
                // user: {
                //     connect: { id: userId }
                // },
                relatedEntity: propertyId ? 'property' : null,
                relatedEntityId: propertyId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        // Envoyer la notification en temps réel
        const notificationData = {
            id: `notification_${notification.id}`,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            propertyId: propertyId,
            createdAt: notification.createdAt,
            read: notification.read,
            source: 'system'
        };

        if (userId) {
            await sendNotification(userId, notificationData);
            const unreadCount = await getUnreadCount(userId);
            await updateNotificationCount(userId, unreadCount);
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
            error: 'Erreur serveur lors de la création',
            details: error.message
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