// utils/notificationHelper.js
const { prisma } = require("../lib/db");

/**
 * Fonction générique pour créer et émettre une notification
 * @param {Object} params
 * @param {string} params.userId - ID de l'utilisateur concerné
 * @param {string} params.type - Type de notification ('info', 'warning', 'success', 'error')
 * @param {string} params.title - Titre de la notification
 * @param {string} params.message - Message de la notification
 * @param {string} [params.relatedEntity] - Ex: 'audit', 'user', 'service'...
 * @param {string} [params.relatedEntityId] - ID de l'entité liée
 * @param {object} [params.io] - Instance socket.io pour émission en temps réel
 */
async function createNotification({
  userId,
  type,
  title,
  message,
  relatedEntity,
  relatedEntityId,
  io,
}) {
  try {
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

    // 🔥 Envoi temps réel via WebSocket
    if (io) {
      io.to(`user:${userId}`).emit("new_notification", notification);
    }

    return notification;
  } catch (error) {
    console.error("❌ Erreur lors de la création de la notification:", error);
  }
}

module.exports = { createNotification };
 