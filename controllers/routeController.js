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
