// routes/busRoutes.js
const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');

// Debug guard (remove after it’s stable)
['getAllBuses','getBusById','getBusLocation','getBusStatus'].forEach(fn => {
  if (typeof busController[fn] !== 'function') {
    console.error(`[busRoutes] Missing handler: ${fn} is`, typeof busController[fn]);
  }
});

// GET all buses (optional ?route_id=&date=YYYY-MM-DD)
router.get('/', busController.getAllBuses);

// GET bus details by bus_id
router.get('/:bus_id', busController.getBusById);

// GET bus location only
router.get('/:bus_id/location', busController.getBusLocation);

// GET bus status only
router.get('/:bus_id/status', busController.getBusStatus);

module.exports = router;










// // routes/busRoutes.js
// const express = require('express');
// const router = express.Router();
// const busController = require('../controllers/busController');

// // ---- NEW week-ahead plan endpoints (order matters) ----
// router.get('/plan', busController.getBusPlansForDate);       // /buses/plan?date=YYYY-MM-DD[&route_id=101]
// router.get('/:bus_id/plan', busController.getBusPlanForDate); // /buses/:bus_id/plan?date=YYYY-MM-DD

// // Existing endpoints
// router.get('/', busController.getAllBuses);
// router.get('/:bus_id', busController.getBusById);
// router.get('/:bus_id/location', busController.getBusLocation);
// router.get('/:bus_id/status', busController.getBusStatus);

// module.exports = router;









// const express = require('express');
// const router = express.Router();
// const busController = require('../controllers/busController');

// // GET all buses (optional query ?route_id=)
// router.get('/', busController.getAllBuses);

// // GET bus details by bus_id
// router.get('/:bus_id', busController.getBusById);

// // GET bus location only
// router.get('/:bus_id/location', busController.getBusLocation);

// // GET bus status only
// router.get('/:bus_id/status', busController.getBusStatus);

// module.exports = router;
