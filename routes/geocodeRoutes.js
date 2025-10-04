// routes/geocodeRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/geocodeController');

router.get('/', controller.geocode);
router.post('/batch', controller.batchGeocode);

module.exports = router;
