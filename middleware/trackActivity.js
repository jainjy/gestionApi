// middleware/trackActivity.js
const { prisma } = require('../lib/db');

async function trackSearchActivity(req, res, next) {
  // S'exécuter après la réponse
  const originalSend = res.send;
  
  res.send = function(data) {
    // Appeler l'original d'abord
    originalSend.apply(res, arguments);
    
    // Enregistrer l'activité en arrière-plan
    setTimeout(async () => {
      try {
        const userId = req.user?.id || req.body.userId;
        const query = req.body.prompt || req.body.query;
        
        if (userId && query) {
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
          const resultsCount = parsedData.results?.length || 0;
          
          await prisma.userActivity.create({
            data: {
              userId,
              entityType: 'SEARCH',
              entityId: `search_${Date.now()}`,
              action: 'SEARCH',
              searchQuery: query,
              metadata: {
                resultsCount,
                success: parsedData.success || false,
                timestamp: new Date().toISOString()
              }
            }
          });
        }
      } catch (error) {
        console.error("Erreur tracking activité:", error);
        // Ne pas bloquer l'utilisateur en cas d'erreur
      }
    }, 0);
  };
  
  next();
}

module.exports = { trackSearchActivity };