// routes/busRoutes.js
const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const apiKey = require('../middleware/apiKey');

// GET all buses (optional ?route_id=&date=YYYY-MM-DD)
router.get('/', busController.getAllBuses);

// GET bus details by bus_id
router.get('/:bus_id', busController.getBusById);

// GET bus location only
router.get('/:bus_id/location', busController.getBusLocation);

// GET bus status only
router.get('/:bus_id/status', busController.getBusStatus);

// Operator-secured updates
router.patch('/:bus_id/location', apiKey, busController.updateBusLocation);
router.patch('/:bus_id/status', apiKey, busController.updateBusStatus);

module.exports = router;













// // routes/busRoutes.js
// const express = require('express');
// const router = express.Router();
// const busController = require('../controllers/busController');

// // Debug guard (remove after it’s stable)
// ['getAllBuses','getBusById','getBusLocation','getBusStatus'].forEach(fn => {
//   if (typeof busController[fn] !== 'function') {
//     console.error(`[busRoutes] Missing handler: ${fn} is`, typeof busController[fn]);
//   }
// });

// // GET all buses (optional ?route_id=&date=YYYY-MM-DD)
// router.get('/', busController.getAllBuses);

// // GET bus details by bus_id
// router.get('/:bus_id', busController.getBusById);

// // GET bus location only
// router.get('/:bus_id/location', busController.getBusLocation);

// // GET bus status only
// router.get('/:bus_id/status', busController.getBusStatus);

// module.exports = router;





