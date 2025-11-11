// Fonction utilitaire pour émettre un nouveau message
const emitNewMessage = (req, message) => {
  const io = req.app.get("io");
  if (io && message.conversationId) {
    io.to(`conversation:${message.conversationId}`).emit(
      "new_message",
      message
    );
    console.log("Message émis via Socket.io:", message.id);
  }
};

module.exports = {
  emitNewMessage,
};