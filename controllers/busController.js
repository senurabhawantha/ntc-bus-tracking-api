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

