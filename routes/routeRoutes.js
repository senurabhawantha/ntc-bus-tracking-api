// routes/routeRoutes.js
const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');

// GET all routes
router.get('/', routeController.getAllRoutes);

// GET details of a specific route by route_id
router.get('/:route_id', routeController.getRouteById);

// GET schedule for a route
router.get('/:route_id/schedule', routeController.getRouteSchedule);

module.exports = router;














// const express = require('express');
// const router = express.Router();
// const routeController = require('../controllers/routeController');

// // GET all routes
// router.get('/', routeController.getAllRoutes);

// // GET details of a specific route by route_id
// router.get('/:route_id', routeController.getRouteById);

// // Optional: GET schedule for a route (if implemented)
// router.get('/:route_id/schedule', routeController.getRouteSchedule);

// module.exports = router;










// const express = require('express');
// const router = express.Router();
// const routeController = require('../controllers/routeController');

// // GET all routes
// router.get('/', routeController.getAllRoutes);

// // GET details of a specific route by route_id
// router.get('/:route_id', routeController.getRouteById);

// // Optional: GET schedule for a route (if implemented)
// router.get('/:route_id/schedule', routeController.getRouteSchedule);

// module.exports = router;









// const express = require('express');
// const router = express.Router();
// const routeController = require('../controllers/routeController');

// // Get all routes
// router.get('/', routeController.getAllRoutes);

// // Get a single route by ID
// router.get('/:route_id', routeController.getRouteById);

// module.exports = router;









// const express = require('express');
// const router = express.Router();
// const routeController = require('../controllers/routeController');

// // GET all routes
// router.get('/', routeController.getAllRoutes);

// // GET a specific route by ID
// router.get('/:route_id', routeController.getRouteById);

// module.exports = router;
