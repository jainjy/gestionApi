// lib/socket.js
const socketIO = require('socket.io');
const { prisma } = require('./db');

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Utilisateur connecté:', socket.id);

    // Rejoindre une room spécifique à l'utilisateur
    socket.on('join-user-room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 Utilisateur ${userId} a rejoint sa room`);
    });

    socket.on('disconnect', () => {
      console.log('❌ Utilisateur déconnecté:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io non initialisé');
  }
  return io;
};

// Fonction pour envoyer une notification en temps réel
const sendNotification = async (userId, notificationData) => {
  try {
    const io = getIO();
    
    // Émettre la notification à la room spécifique de l'utilisateur
    io.to(`user_${userId}`).emit('new-notification', {
      ...notificationData,
      timestamp: new Date().toISOString()
    });

    console.log(`📨 Notification envoyée à l'utilisateur ${userId}`);
  } catch (error) {
    console.error('Erreur envoi notification WebSocket:', error);
  }
};

// Fonction pour mettre à jour le compteur de notifications
const updateNotificationCount = async (userId, count) => {
  try {
    const io = getIO();
    io.to(`user_${userId}`).emit('notification-count-update', {
      count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur mise à jour compteur:', error);
  }
};

module.exports = {
  initSocket,
  getIO,
  sendNotification,
  updateNotificationCount
}; 
