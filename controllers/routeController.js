const Route = require('../models/route');

// Get all routes
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get route by ID
exports.getRouteById = async (req, res) => {
  try {
    const route = await Route.findOne({ route_id: Number(req.params.route_id) });
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json(route);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Optional: Route schedule
exports.getRouteSchedule = async (req, res) => {
  try {
    // For now, send dummy schedule or from simulation
    res.json({ message: 'Route schedule not yet implemented' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};







// const Route = require('../models/route');

// // Get all routes
// exports.getAllRoutes = async (req, res) => {
//   try {
//     const routes = await Route.find();
//     res.json(routes);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Get route by ID
// exports.getRouteById = async (req, res) => {
//   try {
//     const route = await Route.findOne({ route_id: Number(req.params.route_id) });
//     if (!route) return res.status(404).json({ message: 'Route not found' });
//     res.json(route);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };









// const Route = require('../models/route');
// const Bus = require('../models/bus');

// // Get all routes
// exports.getAllRoutes = async (req, res) => {
//   try {
//     const routes = await Route.find();
//     res.json(routes);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Get route by ID
// exports.getRouteById = async (req, res) => {
//   try {
//     const route = await Route.findOne({ route_id: Number(req.params.route_id) });
//     if (!route) return res.status(404).json({ message: 'Route not found' });
//     res.json(route);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Optional: Get schedule for a route
// // For now, we can simulate by returning all buses for this route
// exports.getRouteSchedule = async (req, res) => {
//   try {
//     const route_id = Number(req.params.route_id);
//     const route = await Route.findOne({ route_id });
//     if (!route) return res.status(404).json({ message: 'Route not found' });

//     const buses = await Bus.find({ route_id });
//     res.json({
//       route: route,
//       buses: buses.map(bus => ({
//         bus_id: bus.bus_id,
//         status: bus.status,
//         last_updated: bus.last_updated,
//         current_location: bus.current_location
//       }))
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };












// const Route = require('../models/route');

// // Get all routes
// exports.getAllRoutes = async (req, res) => {
//   try {
//     const routes = await Route.find();
//     res.json(routes);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Get route by ID
// exports.getRouteById = async (req, res) => {
//   try {
//     const route = await Route.findOne({ route_id: Number(req.params.route_id) });
//     if (!route) return res.status(404).json({ message: 'Route not found' });
//     res.json(route);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };








// const Route = require('../models/route');

// // Get all routes
// exports.getAllRoutes = async (req, res) => {
//   try {
//     const routes = await Route.find();
//     res.json(routes);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Get specific route by ID
// exports.getRouteById = async (req, res) => {
//   try {
//     const route = await Route.findOne({ route_id: Number(req.params.route_id) });
//     if (!route) return res.status(404).json({ message: 'Route not found' });
//     res.json(route);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };
