// routes/userService.js - VERSION CORRIGÉE
const express = require('express')
const router = express.Router()
const userServiceController = require('../controllers/userServiceController')

// Routes publiques pour les services entreprise
router.get('/', userServiceController.getAllUserServices)                    // /api/user/enterprise-services
router.get('/search', userServiceController.searchUserServices)              // /api/user/enterprise-services/search
router.get('/recommended', userServiceController.getRecommendedServices)     // /api/user/enterprise-services/recommended
router.get('/category/:categoryId', userServiceController.getUserServicesByCategory) // /api/user/enterprise-services/category/62
router.get('/type/:type', userServiceController.getUserServicesByType)       // /api/user/enterprise-services/type/entreprise
router.get('/:id', userServiceController.getUserServiceById)                 // /api/user/enterprise-services/1
router.get('/categories/list', userServiceController.getCategoriesWithServices) // /api/user/enterprise-services/categories/list

module.exports = router