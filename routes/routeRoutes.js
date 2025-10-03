const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');

// Get all routes
router.get('/', routeController.getAllRoutes);

// Get a single route by ID
router.get('/:route_id', routeController.getRouteById);

module.exports = router;









// const express = require('express');
// const router = express.Router();
// const routeController = require('../controllers/routeController');

// // GET all routes
// router.get('/', routeController.getAllRoutes);

// // GET a specific route by ID
// router.get('/:route_id', routeController.getRouteById);

// module.exports = router;
