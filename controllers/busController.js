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

