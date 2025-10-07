// controllers/routeController.js
const Route = require('../models/route');
const Bus = require('../models/bus');

// Get all routes
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().lean();
    res.json(routes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get route by ID
exports.getRouteById = async (req, res) => {
  try {
    const route = await Route.findOne({ route_id: Number(req.params.route_id) }).lean();
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json(route);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * GET /routes/:route_id/schedule?date=YYYY-MM-DD&headway=45&start=05:00&end=22:00
 * - Generates a schedule of trips at a fixed headway (default 45 minutes) for the given route & date.
 * - Assigns buses for that route in ascending bus_id order, cycling through if needed.
 * - Returns: [{ bus_id, route_id, start_time, start_city, end_city }]
 *   where start_time is HH:mm (no date in string, as your table wants).
 */
exports.getRouteSchedule = async (req, res) => {
  try {
    const route_id = Number(req.params.route_id);
    const route = await Route.findOne({ route_id }).lean();
    if (!route) return res.status(404).json({ message: 'Route not found' });

    // parse cities from route.name like "Colombo to Kandy"
    let start_city = 'Start';
    let end_city = 'End';
    if (route.name && route.name.includes('to')) {
      const [a, b] = route.name.split('to');
      start_city = (a || '').trim() || start_city;
      end_city = (b || '').trim() || end_city;
    }

    // query params
    const dateStr = (req.query.date || '').trim();
    const headwayMin = Math.max(1, Number(req.query.headway || 45)); // default 45
    const startHHMM = (req.query.start || '05:00').trim();
    const endHHMM = (req.query.end || '22:00').trim();

    // Build the target date (defaults to "today" local server time if missing)
    let baseDate = new Date();
    if (dateStr) {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return res.status(400).json({ message: 'Invalid date. Use YYYY-MM-DD.' });
      baseDate = new Date(Date.UTC(y, m - 1, d)); // we only need the day anchor; we’ll print HH:mm only
    }

    function parseHHMM(s) {
      const [hh, mm] = s.split(':').map(Number);
      return { hh: Number.isFinite(hh) ? hh : 0, mm: Number.isFinite(mm) ? mm : 0 };
    }
    const { hh: startH, mm: startM } = parseHHMM(startHHMM);
    const { hh: endH, mm: endM } = parseHHMM(endHHMM);

    // minutes since midnight helpers
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) {
      return res.status(400).json({ message: 'end must be after start (HH:mm).' });
    }

    // get buses for the route, ascending by bus_id
    const buses = await Bus.find({ route_id }).sort({ bus_id: 1 }).lean();
    if (!buses.length) return res.json([]);

    // generate trips on headway
    const trips = [];
    let mins = startMinutes;
    let idx = 0;
    while (mins <= endMinutes) {
      const bus = buses[idx % buses.length];
      const hh = Math.floor(mins / 60);
      const mm = mins % 60;
      const hhmm = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

      trips.push({
        bus_id: bus.bus_id,
        route_id,
        start_time: hhmm,        // << no date string, as you asked
        start_city,
        end_city
      });

      mins += headwayMin;
      idx += 1;
    }

    // keep trips sorted by start_time then bus_id
    trips.sort((a, b) => {
      if (a.start_time === b.start_time) return a.bus_id - b.bus_id;
      return a.start_time.localeCompare(b.start_time);
    });

    res.json(trips);
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

// // Optional: Route schedule
// exports.getRouteSchedule = async (req, res) => {
//   try {
//     // For now, send dummy schedule or from simulation
//     res.json({ message: 'Route schedule not yet implemented' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

