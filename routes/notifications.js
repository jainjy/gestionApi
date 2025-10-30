const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    getNotificationsForUser,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    clearAllNotifications
} = require('../controllers/notificationsController');

router.get('/user/:userId', authenticateToken, getNotificationsForUser);
router.post('/user/:userId/read/:notificationId', authenticateToken, markAsRead);
router.post('/user/:userId/unread/:notificationId', authenticateToken, markAsUnread);
router.post('/user/:userId/read-all', authenticateToken, markAllAsRead);
router.post('/user/:userId/clear-all', authenticateToken, clearAllNotifications);

module.exports = router;