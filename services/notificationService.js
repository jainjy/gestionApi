// services/notificationService.js
const { prisma } = require("../lib/db");

/**
 * Crée une notification dans la base de données et l'envoie via WebSocket
 * @param {Object} options
 * @param {number} options.userId - ID de l'utilisateur concerné
 * @param {string} options.type - Type de notification ("info", "warning", "error", etc.)
 * @param {string} options.title - Titre de la notification
 * @param {string} options.message - Message de la notification
 * @param {string} [options.relatedEntity] - Type d'entité liée (ex: "audit")
 * @param {string} [options.relatedEntityId] - ID de l'entité liée
 * @param {Object} [options.io] - Instance de socket.io pour émettre la notification
 */
async function createNotification({
  userId,
  type,
  title,
  message,
  relatedEntity = null,
  relatedEntityId = null,
  io = null,
}) {
  try {
    // ✅ Enregistrer la notification dans la base
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedEntity,
        relatedEntityId,
      },
    });

    // ✅ Envoyer la notification en temps réel si le socket est dispo
    if (io) {
      io.emit("new_notification", notification);
    }

    return notification;
  } catch (error) {
    console.error("Erreur lors de la création de la notification :", error);
    throw error;
  }
}

module.exports = { createNotification };
