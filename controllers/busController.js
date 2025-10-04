// controllers/busController.js
const Bus = require('../models/bus');

function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

// GET /buses  (optional ?route_id=&date=YYYY-MM-DD)
async function getAllBuses(req, res) {
  try {
    const { route_id, date } = req.query;
    const query = route_id ? { route_id: Number(route_id) } : {};
    const buses = await Bus.find(query).lean();

    if (!date) {
      return res.json(buses.map(b => ({
        bus_id: b.bus_id,
        route_id: b.route_id,
        status: b.status,
        current_location: b.current_location,
        last_updated: b.last_updated
      })));
    }

    const target = new Date(date);
    if (isNaN(target.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const shaped = buses.map(b => {
      const day = (b.dailyLocations || []).find(x => isSameDay(x.date, target));
      if (day) {
        return {
          bus_id: b.bus_id,
          route_id: b.route_id,
          status: day.status,
          current_location: day.location,
          last_updated: day.date
        };
      }
      // fallback to current
      return {
        bus_id: b.bus_id,
        route_id: b.route_id,
        status: b.status,
        current_location: b.current_location,
        last_updated: b.last_updated
      };
    });

    res.json(shaped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
}

// GET /buses/:bus_id
async function getBusById(req, res) {
  try {
    const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
}

// GET /buses/:bus_id/location
async function getBusLocation(req, res) {
  try {
    const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus.current_location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
}

// GET /buses/:bus_id/status
async function getBusStatus(req, res) {
  try {
    const bus = await Bus.findOne({ bus_id: Number(req.params.bus_id) });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json({ status: bus.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
}

module.exports = {
  getAllBuses,
  getBusById,
  getBusLocation,
  getBusStatus,
};









// // controllers/busController.js
// const Bus = require('../models/bus');

// function isSameDay(a, b) {
//   const da = new Date(a), db = new Date(b);
//   return da.getFullYear() === db.getFullYear()
//     && da.getMonth() === db.getMonth()
//     && da.getDate() === db.getDate();
// }

// // GET all buses (optional ?route_id=&date=YYYY-MM-DD)
// exports.getAllBuses = async (req, res) => {
//   try {
//     const { route_id, date } = req.query;
//     const query = route_id ? { route_id: Number(route_id) } : {};

//     const buses = await Bus.find(query).lean();

//     if (!date) {
//       // default: return current fields (as before)
//       return res.json(buses.map(b => ({
//         bus_id: b.bus_id,
//         route_id: b.route_id,
//         status: b.status,
//         current_location: b.current_location,
//         last_updated: b.last_updated
//       })));
//     }

//     const target = new Date(date);
//     if (isNaN(target.getTime())) {
//       return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
//     }

//     // For requested date, pull that day’s location/status from dailyLocations
//     const shaped = buses.map(b => {
//       const day = (b.dailyLocations || []).find(x => isSameDay(x.date, target));
//       if (day) {
//         return {
//           bus_id: b.bus_id,
//           route_id: b.route_id,
//           status: day.status,
//           current_location: day.location,
//           last_updated: day.date
//         };
//       }
//       // fallback: current if that day missing
//       return {
//         bus_id: b.bus_id,
//         route_id: b.route_id,
//         status: b.status,
//         current_location: b.current_location,
//         last_updated: b.last_updated
//       };
//     });

//     res.json(shaped);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // GET bus by ID
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

// // GET bus location (current)
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

// // GET bus status (current)
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









// // controllers/busController.js
// const fs = require('fs');
// const path = require('path');
// const Bus = require('../models/bus');

// // ---------------- live endpoints you already had ----------------
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

// // ---------------- NEW: week-ahead plan endpoints ----------------
// let FUTURE_CACHE = null; // { routes: [...], buses: [{bus_id, route_id, plan:[{date, waypoints, statusForecast}]}] }

// function loadFutureWeek() {
//   if (FUTURE_CACHE) return FUTURE_CACHE;
//   const p = path.join(__dirname, '..', 'data', 'busFutureWeek.json');
//   const raw = fs.readFileSync(p, 'utf-8');
//   FUTURE_CACHE = JSON.parse(raw);
//   return FUTURE_CACHE;
// }

// function isValidISODate(d) {
//   // expects YYYY-MM-DD
//   return /^\d{4}-\d{2}-\d{2}$/.test(d);
// }

// function withinNext7Days(iso) {
//   const now = new Date();
//   now.setUTCHours(0,0,0,0);
//   const target = new Date(`${iso}T00:00:00.000Z`);
//   const diffDays = (target - now) / (24*60*60*1000);
//   return diffDays >= 0 && diffDays < 7;
// }

// // GET /buses/:bus_id/plan?date=YYYY-MM-DD
// exports.getBusPlanForDate = (req, res) => {
//   try {
//     const { bus_id } = req.params;
//     const { date } = req.query;

//     if (!date || !isValidISODate(date)) {
//       return res.status(400).json({ message: 'Provide date=YYYY-MM-DD' });
//     }
//     if (!withinNext7Days(date)) {
//       return res.status(400).json({ message: 'date must be today..+6 days' });
//     }

//     const data = loadFutureWeek();
//     const bus = data.buses.find(b => b.bus_id === Number(bus_id));
//     if (!bus) return res.status(404).json({ message: 'Bus not found in plan' });

//     const day = bus.plan.find(p => p.date === date);
//     if (!day) return res.status(404).json({ message: 'No plan for this date' });

//     return res.json({
//       bus_id: bus.bus_id,
//       route_id: bus.route_id,
//       date: day.date,
//       statusForecast: day.statusForecast,
//       waypoints: day.waypoints, // [{time,lat,lng},...]
//     });
//   } catch (e) {
//     console.error('getBusPlanForDate error:', e);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

// // GET /buses/plan?date=YYYY-MM-DD[&route_id=101]
// exports.getBusPlansForDate = (req, res) => {
//   try {
//     const { date, route_id } = req.query;

//     if (!date || !isValidISODate(date)) {
//       return res.status(400).json({ message: 'Provide date=YYYY-MM-DD' });
//     }
//     if (!withinNext7Days(date)) {
//       return res.status(400).json({ message: 'date must be today..+6 days' });
//     }

//     const data = loadFutureWeek();
//     const routeFilter = route_id ? Number(route_id) : null;

//     const result = data.buses
//       .filter(b => (routeFilter ? b.route_id === routeFilter : true))
//       .map(b => {
//         const day = b.plan.find(p => p.date === date);
//         if (!day) return null;
//         return {
//           bus_id: b.bus_id,
//           route_id: b.route_id,
//           date: day.date,
//           statusForecast: day.statusForecast,
//           waypoints: day.waypoints,
//         };
//       })
//       .filter(Boolean);

//     return res.json({ date, count: result.length, items: result });
//   } catch (e) {
//     console.error('getBusPlansForDate error:', e);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };











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

