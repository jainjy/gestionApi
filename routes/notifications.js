const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    getNotificationsForUser,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    createNotification
} = require('../controllers/notificationsController');

// GET /api/notifications/user/:userId - Récupérer toutes les notifications
router.get('/user/:userId', authenticateToken, getNotificationsForUser);

// POST /api/notifications/user/:userId/read/:notificationId - Marquer une notification comme lue
router.post('/user/:userId/read/:notificationId', authenticateToken, markAsRead);

// POST /api/notifications/user/:userId/unread/:notificationId - Marquer une notification comme non lue
router.post('/user/:userId/unread/:notificationId', authenticateToken, markAsUnread);

// POST /api/notifications/user/:userId/read-all - Marquer toutes les notifications comme lues
router.post('/user/:userId/read-all', authenticateToken, markAllAsRead);

// DELETE /api/notifications/user/:userId/delete/:notificationId - Supprimer une notification
router.delete('/user/:userId/delete/:notificationId', authenticateToken, deleteNotification);

// POST /api/notifications/user/:userId/clear-all - Supprimer toutes les notifications
router.post('/user/:userId/clear-all', authenticateToken, clearAllNotifications);

// POST /api/notifications/create - Créer une nouvelle notification
router.post('/create', authenticateToken, createNotification);

module.exports = router;