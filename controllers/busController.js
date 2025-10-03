const Bus = require('../models/bus');

// Get all buses (optional filter by route)
exports.getAllBuses = async (req, res) => {
  try {
    const { route_id } = req.query;
    const query = route_id ? { route_id: Number(route_id) } : {};
    const buses = await Bus.find(query);
    res.json(buses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get bus by ID
exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get bus location
exports.getBusLocation = async (req, res) => {
  try {
    const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus.current_location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get bus status
exports.getBusStatus = async (req, res) => {
  try {
    const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json({ status: bus.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};







// const Bus = require('../models/bus');

// // Get all buses (optional filter by route)
// exports.getAllBuses = async (req, res) => {
//   try {
//     const { route_id } = req.query;
//     const query = route_id ? { route_id: Number(route_id) } : {};
//     const buses = await Bus.find(query);
//     res.json(buses);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Get bus by ID
// exports.getBusById = async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
//     if (!bus) return res.status(404).json({ message: 'Bus not found' });
//     res.json(bus);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Get bus location
// exports.getBusLocation = async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
//     if (!bus) return res.status(404).json({ message: 'Bus not found' });
//     res.json(bus.current_location);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Get bus status
// exports.getBusStatus = async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
//     if (!bus) return res.status(404).json({ message: 'Bus not found' });
//     res.json({ status: bus.status });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };













// const Bus = require('../models/bus');

// /**
//  * GET /buses
//  * Get all buses, optionally filtered by route_id
//  */
// exports.getAllBuses = async (req, res) => {
//   try {
//     const { route_id } = req.query;
//     const query = route_id ? { route_id: Number(route_id) } : {};
//     const buses = await Bus.find(query);
//     res.json(buses);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error while fetching buses' });
//   }
// };

// /**
//  * GET /buses/:bus_id
//  * Get bus details by ID
//  */
// exports.getBusById = async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
//     if (!bus) return res.status(404).json({ error: 'Bus not found' });
//     res.json(bus);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error while fetching bus' });
//   }
// };

// /**
//  * GET /buses/:bus_id/location
//  * Get only the current location of the bus
//  */
// exports.getBusLocation = async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
//     if (!bus) return res.status(404).json({ error: 'Bus not found' });
//     res.json({ latitude: bus.current_location.latitude, longitude: bus.current_location.longitude });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error while fetching bus location' });
//   }
// };

// /**
//  * GET /buses/:bus_id/status
//  * Get only the current status of the bus
//  */
// exports.getBusStatus = async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
//     if (!bus) return res.status(404).json({ error: 'Bus not found' });
//     res.json({ status: bus.status });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error while fetching bus status' });
//   }
// };















// const Bus = require('../models/bus');

// // Get all buses, optionally filtered by route_id
// exports.getAllBuses = async (req, res) => {
//   try {
//     const { route_id } = req.query;
//     const query = route_id ? { route_id: Number(route_id) } : {};
//     const buses = await Bus.find(query);
//     res.json(buses);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Get bus by ID
// exports.getBusById = async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
//     if (!bus) return res.status(404).json({ message: 'Bus not found' });
//     res.json(bus);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Get bus location
// exports.getBusLocation = async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
//     if (!bus) return res.status(404).json({ message: 'Bus not found' });
//     res.json({ latitude: bus.current_location.latitude, longitude: bus.current_location.longitude });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Get bus status
// exports.getBusStatus = async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
//     if (!bus) return res.status(404).json({ message: 'Bus not found' });
//     res.json({ status: bus.status });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };









// const Bus = require('../models/bus');

// // Get all buses (optionally filtered by route_id)
// exports.getAllBuses = async (req, res) => {
//   try {
//     const { route_id } = req.query;
//     const query = route_id ? { route_id: Number(route_id) } : {};
//     const buses = await Bus.find(query);
//     res.json(buses);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Get a specific bus by ID
// exports.getBusById = async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
//     if (!bus) return res.status(404).json({ message: 'Bus not found' });
//     res.json(bus);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // Get location of a specific bus
// exports.getBusLocation = async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
//     if (!bus) return res.status(404).json({ message: 'Bus not found' });
//     res.json(bus.current_location);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };
