const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')

// GET /api/articles - Récupérer tous les articles avec filtres
router.get('/', async (req, res) => {
  try {
    const { search, category, status } = req.query

    // Construire les filtres
    const where = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }

    if (category && category !== 'Toutes') {
      where.category = category
    }

    if (status && status !== 'Tous') {
      where.status = status
    }

    const articles = await prisma.blogArticle.findMany({
      where,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formater les données pour le frontend
    const formattedArticles = articles.map(article => ({
      id: article.id,
      titre: article.title,
      date: article.publishedAt 
        ? new Date(article.publishedAt).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })
        : 'Non publié',
      dateCreation: article.createdAt.toISOString().split('T')[0],
      dateModification: article.updatedAt.toISOString().split('T')[0],
      categorie: article.category,
      description: article.excerpt || '',
      image: article.coverUrl || '/api/placeholder/400/250',
      contenu: article.content,
      auteur: `${article.author.firstName} ${article.author.lastName}`,
      tempsLecture: article.readTime || '3 min',
      statut: article.status,
      tags: article.tags,
      vues: article.views,
      likes: article.likes,
      commentaires: article.comments,
      datePublication: article.publishedAt?.toISOString().split('T')[0]
    }))

    res.json(formattedArticles)
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/articles - Créer un nouvel article
router.post('/', async (req, res) => {
  try {
    const {
      titre,
      description,
      contenu,
      categorie,
      tags,
      statut,
      datePublication,
      image,
      authorId
    } = req.body

    // Générer un slug à partir du titre
    const slug = titre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    // Calculer le temps de lecture
    const wordCount = contenu.split(/\s+/).length
    const readTime = `${Math.ceil(wordCount / 200)} min`

    const article = await prisma.blogArticle.create({
      data: {
        title: titre,
        slug,
        content: contenu,
        excerpt: description,
        category: categorie,
        tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
        status: statut,
        coverUrl: image || null,
        readTime,
        publishedAt: statut === 'publié' || statut === 'programmé' 
          ? new Date(datePublication || new Date())
          : null,
        authorId: authorId
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    res.json(article)
  } catch (error) {
    console.error('Erreur lors de la création de l\'article:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/articles/:id - Récupérer un article spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const article = await prisma.blogArticle.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' })
    }

    res.json(article)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/articles/:id - Mettre à jour un article
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      titre,
      description,
      contenu,
      categorie,
      tags,
      statut,
      datePublication,
      image
    } = req.body

    // Calculer le temps de lecture
    const wordCount = contenu.split(/\s+/).length
    const readTime = `${Math.ceil(wordCount / 200)} min`

    const article = await prisma.blogArticle.update({
      where: { id },
      data: {
        title: titre,
        content: contenu,
        excerpt: description,
        category: categorie,
        tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
        status: statut,
        coverUrl: image || null,
        readTime,
        publishedAt: statut === 'publié' || statut === 'programmé' 
          ? new Date(datePublication || new Date())
          : null,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    res.json(article)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'article:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/articles/:id - Supprimer un article
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    await prisma.blogArticle.delete({
      where: { id }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router