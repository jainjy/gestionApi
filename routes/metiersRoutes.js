// server/routes/metiersRoutes.js
const express = require('express');
const router = express.Router();
const metiersController = require('../controllers/metiersController');
const servicesController = require("../controllers/servicesController");

router.get("/services", servicesController.getAllServices);
router.get('/', metiersController.getAllMetiers);
router.get('/all', metiersController.getMetiers);
router.get('/stats', metiersController.getMetiersStats);
router.get('/:id', metiersController.getMetierById);
router.post('/', metiersController.createMetier);
router.put('/:id', metiersController.updateMetier);
router.delete('/:id', metiersController.deleteMetier);

module.exports = router;