const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');

// Get all buses, optionally filtered by route
router.get('/', busController.getAllBuses);

// Get a single bus by ID
router.get('/:bus_id', busController.getBusById);

// Get bus location
router.get('/:bus_id/location', busController.getBusLocation);

// Get bus status
router.get('/:bus_id/status', busController.getBusStatus);

module.exports = router;










// const express = require('express');
// const router = express.Router();
// const busController = require('../controllers/busController');

// // GET all buses or filter by route
// router.get('/', busController.getAllBuses);

// // GET a specific bus by ID
// router.get('/:bus_id', busController.getBusById);

// // GET location of a specific bus
// router.get('/:bus_id/location', busController.getBusLocation);

// module.exports = router;

// const express = require('express');
// const router = express.Router();
// const busController = require('../controllers/busController');

// // Get all buses, optionally filtered by route
// router.get('/', busController.getAllBuses);

// // Get a single bus by ID
// router.get('/:bus_id', busController.getBusById);

// // Get bus location
// router.get('/:bus_id/location', busController.getBusLocation);

// // Get bus status
// router.get('/:bus_id/status', busController.getBusStatus);

// module.exports = router;
