const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');

// GET all buses (optional query ?route_id=)
router.get('/', busController.getAllBuses);

// GET bus details by bus_id
router.get('/:bus_id', busController.getBusById);

// GET bus location only
router.get('/:bus_id/location', busController.getBusLocation);

// GET bus status only
router.get('/:bus_id/status', busController.getBusStatus);

module.exports = router;
