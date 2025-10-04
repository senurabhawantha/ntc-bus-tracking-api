// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db'); // <-- use the exported function
const Bus = require('./models/bus');
const Route = require('./models/route');

const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 5000;

// ---------------- API ROUTES ----------------
app.use('/buses', busRoutes);
app.use('/routes', routeRoutes);

// geocode limiter (tweak if needed)
const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.GEOCODE_MAX_PER_MIN || 120),
});
app.use('/geocode', geocodeLimiter, geocodeRoutes);

// 1-week simulation JSON
const simulationData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'busSimulation.json'))
);
const routesJson = simulationData.routes;
const busesJson = simulationData.buses;

// Seed DB
async function seedDB() {
  try {
    const routeCount = await Route.countDocuments();
    const busCount = await Bus.countDocuments();

    if (routeCount === 0) {
      await Route.insertMany(routesJson);
    }
    if (busCount === 0) {
      await Bus.insertMany(
        busesJson.map(b => ({
          bus_id: b.bus_id,
          route_id: b.route_id,
          current_location: b.dailyLocations[0].location,
          status: b.dailyLocations[0].status,
          last_updated: b.dailyLocations[0].date,
        }))
      );
    }
    console.log('✅ Database seeded (or already has data).');
  } catch (err) {
    console.error('❌ Error seeding database:', err.message || err);
  }
}

// flip statuses periodically so frontend sees changes
function startStatusFlipper() {
  setInterval(async () => {
    try {
      const all = await Bus.find({});
      for (const b of all) {
        b.status = Math.random() < 0.75 ? 'On Time' : 'Delayed';
        b.last_updated = new Date();
        await b.save();
      }
    } catch (e) {
      console.error('Status flip error:', e.message);
    }
  }, 20000);
}

// --------------- BOOTSTRAP (await DB) ---------------
(async () => {
  try {
    await connectDB();           // <-- wait for MongoDB to be ready
    await seedDB();              // <-- then seed safely
    startStatusFlipper();        // optional simulation

    app.listen(PORT, () =>
      console.log(`API running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('Fatal startup error:', err.message || err);
    process.exit(1);
  }
})();

// optional: handle rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
