const { prisma } = require('../lib/db');
const SupabaseService = require('./supabaseService');

class MediaService {
  /**
   * CRÉER UN PODCAST
   */
  static async createPodcast(podcastData, audioFile, imageFile = null) {
    try {
      console.log('🎙️  Création podcast avec Supabase...');

      // Upload des fichiers vers Supabase
      const audioUpload = await SupabaseService.uploadPodcastAudio(audioFile);
      let thumbnailUpload = null;

      if (imageFile) {
        thumbnailUpload = await SupabaseService.uploadThumbnail(imageFile);
      }

      // Créer le podcast dans la base de données
      const podcast = await prisma.podcast.create({
        data: {
          title: podcastData.title,
          description: podcastData.description,
          duration: podcastData.duration,
          audioFile: audioUpload.fileName, // Nom du fichier dans Supabase
          audioUrl: audioUpload.publicUrl, // URL publique Supabase
          imageUrl: thumbnailUpload ? thumbnailUpload.publicUrl : podcastData.imageUrl || 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=250&fit=crop',
          categoryId: parseInt(podcastData.categoryId),
          authorId: podcastData.authorId,
          fileSize: audioUpload.fileSize,
          mimeType: audioUpload.mimeType,
          listens: 0,
          isActive: true
        },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      return {
        success: true,
        data: podcast,
        message: 'Podcast créé avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur création podcast:', error);
      
      // Nettoyage en cas d'erreur (optionnel)
      // Les fichiers sont déjà nettoyés dans SupabaseService en cas d'erreur
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * CRÉER UNE VIDÉO
   */
  static async createVideo(videoData, videoFile, thumbnailFile = null) {
    try {
      console.log('🎥 Création vidéo avec Supabase...');

      // Upload des fichiers vers Supabase
      const videoUpload = await SupabaseService.uploadVideo(videoFile);
      let thumbnailUpload = null;

      if (thumbnailFile) {
        thumbnailUpload = await SupabaseService.uploadThumbnail(thumbnailFile);
      }

      // Créer la vidéo dans la base de données
      const video = await prisma.video.create({
        data: {
          title: videoData.title,
          description: videoData.description,
          duration: videoData.duration,
          videoFile: videoUpload.fileName, // Nom du fichier dans Supabase
          videoUrl: videoUpload.publicUrl, // URL publique Supabase
          thumbnailUrl: thumbnailUpload ? thumbnailUpload.publicUrl : videoData.thumbnailUrl || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop',
          categoryId: parseInt(videoData.categoryId),
          authorId: videoData.authorId,
          fileSize: videoUpload.fileSize,
          mimeType: videoUpload.mimeType,
          views: 0,
          isActive: true
        },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      return {
        success: true,
        data: video,
        message: 'Vidéo créée avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur création vidéo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * SUPPRIMER UN PODCAST
   */
  static async deletePodcast(podcastId) {
    try {
      // Récupérer le podcast pour avoir les noms de fichiers
      const podcast = await prisma.podcast.findUnique({
        where: { id: podcastId }
      });

      if (!podcast) {
        return {
          success: false,
          error: 'Podcast non trouvé'
        };
      }

      // Supprimer les fichiers de Supabase
      await SupabaseService.deletePodcast(podcast.audioFile, this.extractFileName(podcast.imageUrl));

      // Supprimer de la base de données
      await prisma.podcast.delete({
        where: { id: podcastId }
      });

      return {
        success: true,
        message: 'Podcast supprimé avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur suppression podcast:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * SUPPRIMER UNE VIDÉO
   */
  static async deleteVideo(videoId) {
    try {
      // Récupérer la vidéo pour avoir les noms de fichiers
      const video = await prisma.video.findUnique({
        where: { id: videoId }
      });

      if (!video) {
        return {
          success: false,
          error: 'Vidéo non trouvée'
        };
      }

      // Supprimer les fichiers de Supabase
      await SupabaseService.deleteVideo(video.videoFile, this.extractFileName(video.thumbnailUrl));

      // Supprimer de la base de données
      await prisma.video.delete({
        where: { id: videoId }
      });

      return {
        success: true,
        message: 'Vidéo supprimée avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur suppression vidéo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * RÉCUPÉRER UN PODCAST PAR ID
   */
  static async getPodcastById(id) {
    try {
      const podcast = await prisma.podcast.findUnique({
        where: { id },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      if (!podcast) {
        return {
          success: false,
          error: 'Podcast non trouvé'
        };
      }

      return {
        success: true,
        data: podcast
      };

    } catch (error) {
      console.error('❌ Erreur récupération podcast:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * RÉCUPÉRER UNE VIDÉO PAR ID
   */
  static async getVideoById(id) {
    try {
      const video = await prisma.video.findUnique({
        where: { id },
        include: {
          category: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      if (!video) {
        return {
          success: false,
          error: 'Vidéo non trouvée'
        };
      }

      return {
        success: true,
        data: video
      };

    } catch (error) {
      console.error('❌ Erreur récupération vidéo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * INCRÉMENTER LES ÉCOUTES PODCAST
   */
  static async incrementPodcastListens(id) {
    try {
      const podcast = await prisma.podcast.update({
        where: { id },
        data: { listens: { increment: 1 } }
      });

      return {
        success: true,
        data: podcast,
        message: 'Compteur d\'écoutes incrémenté'
      };

    } catch (error) {
      console.error('❌ Erreur incrémentation écoutes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * INCRÉMENTER LES VUES VIDÉO
   */
  static async incrementVideoViews(id) {
    try {
      const video = await prisma.video.update({
        where: { id },
        data: { views: { increment: 1 } }
      });

      return {
        success: true,
        data: video,
        message: 'Compteur de vues incrémenté'
      };

    } catch (error) {
      console.error('❌ Erreur incrémentation vues:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * RÉCUPÉRER LES CATÉGORIES
   */
  static async getCategories(type = null) {
    try {
      const where = type ? { type } : {};
      
      const categories = await prisma.mediaCategory.findMany({
        where,
        orderBy: { name: 'asc' }
      });

      return {
        success: true,
        data: categories
      };

    } catch (error) {
      console.error('❌ Erreur récupération catégories:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * CRÉER UNE CATÉGORIE
   */
  static async createCategory(categoryData) {
    try {
      const category = await prisma.mediaCategory.create({
        data: categoryData
      });

      return {
        success: true,
        data: category,
        message: 'Catégorie créée avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur création catégorie:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extraire le nom de fichier d'une URL Supabase
   */
  static extractFileName(url) {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch (error) {
      return null;
    }
  }
}

module.exports = MediaService;