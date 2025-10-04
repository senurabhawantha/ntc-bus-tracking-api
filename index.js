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







// // index.js
// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const rateLimit = require('express-rate-limit');
// const fs = require('fs');
// const path = require('path');

// // 🔧 Be tolerant to either export style from ./config/db
// const dbModule = require('./config/db');
// const connectDB = typeof dbModule === 'function' ? dbModule : dbModule.connectDB;

// const Bus = require('./models/bus');
// const Route = require('./models/route');

// const busRoutes = require('./routes/busRoutes');
// const routeRoutes = require('./routes/routeRoutes');
// const geocodeRoutes = require('./routes/geocodeRoutes');

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// // Connect to MongoDB (works whether db.js exported a fn or {connectDB})
// if (typeof connectDB !== 'function') {
//   console.error('[DB] connectDB export not found. Check config/db.js exports.');
//   process.exit(1);
// }
// connectDB();

// // API routes
// app.use('/buses', busRoutes);
// app.use('/routes', routeRoutes);

// // Geocoding rate limit
// const geocodeLimiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: Number(process.env.GEOCODE_MAX_PER_MIN || 120),
// });
// app.use('/geocode', geocodeLimiter, geocodeRoutes);

// // Seed DB from simulation JSON if empty
// const simulationData = JSON.parse(
//   fs.readFileSync(path.join(__dirname, 'data', 'busSimulation.json'), 'utf-8')
// );
// const routes = simulationData.routes || [];
// const buses = simulationData.buses || [];

// async function seedDB() {
//   try {
//     const [routeCount, busCount] = await Promise.all([
//       Route.countDocuments(),
//       Bus.countDocuments(),
//     ]);

//     if (routeCount === 0 && routes.length) {
//       await Route.insertMany(routes);
//     }
//     if (busCount === 0 && buses.length) {
//       await Bus.insertMany(
//         buses.map((b) => ({
//           bus_id: b.bus_id,
//           route_id: b.route_id,
//           current_location: b.dailyLocations?.[0]?.location || {
//             latitude: 6.9271,
//             longitude: 79.8612,
//           },
//           status: b.dailyLocations?.[0]?.status || 'On Time',
//           last_updated: b.dailyLocations?.[0]?.date || new Date(),
//         }))
//       );
//     }

//     console.log('✅ Database seeded (if empty).');
//   } catch (err) {
//     console.error('❌ Error seeding database:', err.message);
//   }
// }
// seedDB();

// // Periodically flip statuses to simulate updates
// setInterval(async () => {
//   try {
//     const all = await Bus.find({});
//     for (const b of all) {
//       b.status = Math.random() < 0.75 ? 'On Time' : 'Delayed';
//       b.last_updated = new Date();
//       await b.save();
//     }
//   } catch (e) {
//     console.error('Status flip error:', e.message);
//   }
// }, 20000);

// app.listen(PORT, () => {
//   console.log(`API running on http://localhost:${PORT}`);
// });








// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const fs = require('fs');
// const path = require('path');
// const rateLimit = require('express-rate-limit');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// // If you run behind a proxy (Heroku/Render), this helps rate-limit identify real IP
// app.set('trust proxy', 1);

// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB
// connectDB();

// // Models
// const Bus = require('./models/bus');
// const Route = require('./models/route');

// // Routes
// const busRoutes = require('./routes/busRoutes');
// const routeRoutes = require('./routes/routeRoutes');
// const geocodeRoutes = require('./routes/geocodeRoutes');

// // API routes
// app.use('/buses', busRoutes);
// app.use('/routes', routeRoutes);

// // Dev-friendly geocode rate limit (bump up; tune for prod/demo)
// // Also configurable via env if you want: GEOCODE_MAX_PER_MIN
// const geocodeLimiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: Number(process.env.GEOCODE_MAX_PER_MIN || 120),
// });
// app.use('/geocode', geocodeLimiter, geocodeRoutes);

// // Load 1-week simulation JSON
// const simulationData = JSON.parse(
//   fs.readFileSync(path.join(__dirname, 'data', 'busSimulation.json'))
// );
// const routes = simulationData.routes;
// const buses = simulationData.buses;

// // Seed DB
// const seedDB = async () => {
//   try {
//     const routeCount = await Route.countDocuments();
//     const busCount = await Bus.countDocuments();

//     if (routeCount === 0) await Route.insertMany(routes);
//     if (busCount === 0) {
//       await Bus.insertMany(
//         buses.map(bus => ({
//           bus_id: bus.bus_id,
//           route_id: bus.route_id,
//           current_location: bus.dailyLocations[0].location,
//           status: bus.dailyLocations[0].status,
//           last_updated: bus.dailyLocations[0].date
//         }))
//       );
//     }

//     console.log('Database seeded with 1-week simulation!');
//   } catch (err) {
//     console.error('Error seeding database:', err);
//   }
// };
// seedDB();

// // Simulate status flips every 20s so status/last_updated change
// setInterval(async () => {
//   try {
//     const all = await Bus.find({});
//     for (const b of all) {
//       // keep more On Time than Delayed (≈75% On Time)
//       b.status = Math.random() < 0.75 ? 'On Time' : 'Delayed';
//       b.last_updated = new Date();
//       await b.save();
//     }
//   } catch (e) {
//     console.error('Status flip error:', e.message);
//   }
// }, 20000);

// app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));









// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const fs = require('fs');
// const path = require('path');
// const rateLimit = require('express-rate-limit');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB
// connectDB();

// // Models
// const Bus = require('./models/bus');
// const Route = require('./models/route');

// // Routes
// const busRoutes = require('./routes/busRoutes');
// const routeRoutes = require('./routes/routeRoutes');
// const geocodeRoutes = require('./routes/geocodeRoutes');

// // API routes
// app.use('/buses', busRoutes);
// app.use('/routes', routeRoutes);

// // rate limit only geocoding endpoints (e.g. 30 req/min per IP)
// const geocodeLimiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: 30,
// });
// app.use('/geocode', geocodeLimiter, geocodeRoutes);

// // Load 1-week simulation JSON
// const simulationData = JSON.parse(
//   fs.readFileSync(path.join(__dirname, 'data', 'busSimulation.json'))
// );
// const routes = simulationData.routes;
// const buses = simulationData.buses;

// // Seed DB
// const seedDB = async () => {
//   try {
//     const routeCount = await Route.countDocuments();
//     const busCount = await Bus.countDocuments();

//     if (routeCount === 0) await Route.insertMany(routes);
//     if (busCount === 0) {
//       await Bus.insertMany(
//         buses.map(bus => ({
//           bus_id: bus.bus_id,
//           route_id: bus.route_id,
//           current_location: bus.dailyLocations[0].location,
//           status: bus.dailyLocations[0].status,
//           last_updated: bus.dailyLocations[0].date
//         }))
//       );
//     }

//     console.log('Database seeded with 1-week simulation!');
//   } catch (err) {
//     console.error('Error seeding database:', err);
//   }
// };
// seedDB();

// // --- simulate status flips every 20s so status/last_updated change ---
// setInterval(async () => {
//   try {
//     const buses = await Bus.find({});
//     for (const b of buses) {
//       // keep more On Time than Delayed (e.g. 75% On Time)
//       b.status = Math.random() < 0.75 ? 'On Time' : 'Delayed';
//       b.last_updated = new Date();
//       await b.save();
//     }
//     // console.log('Statuses refreshed');
//   } catch (e) {
//     console.error('Status flip error:', e.message);
//   }
// }, 20000);

// app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));














// // index.js
// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const fs = require('fs');
// const path = require('path');
// const rateLimit = require('express-rate-limit');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB
// connectDB();

// // Models
// const Bus = require('./models/bus');
// const Route = require('./models/route');

// // Routes
// const busRoutes = require('./routes/busRoutes');
// const routeRoutes = require('./routes/routeRoutes');
// const geocodeRoutes = require('./routes/geocodeRoutes');

// // API routes
// app.use('/buses', busRoutes);
// app.use('/routes', routeRoutes);

// // rate limit only geocoding endpoints (e.g. 30 req/min per IP)
// const geocodeLimiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: 30,
// });
// app.use('/geocode', geocodeLimiter, geocodeRoutes);

// // Load 1-week simulation JSON
// const simulationData = JSON.parse(
//   fs.readFileSync(path.join(__dirname, 'data', 'busSimulation.json'))
// );
// const routes = simulationData.routes;
// const buses = simulationData.buses;

// // Seed DB
// const seedDB = async () => {
//   try {
//     const routeCount = await Route.countDocuments();
//     const busCount = await Bus.countDocuments();

//     if (routeCount === 0) await Route.insertMany(routes);
//     if (busCount === 0) {
//       await Bus.insertMany(
//         buses.map(bus => ({
//           bus_id: bus.bus_id,
//           route_id: bus.route_id,
//           current_location: bus.dailyLocations[0].location,
//           status: bus.dailyLocations[0].status,
//           last_updated: bus.dailyLocations[0].date
//         }))
//       );
//     }

//     console.log('Database seeded with 1-week simulation!');
//   } catch (err) {
//     console.error('Error seeding database:', err);
//   }
// };
// seedDB();

// app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));









// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB
// connectDB();

// // Import models
// const Bus = require('./models/bus');
// const Route = require('./models/route');

// // Import routes
// const busRoutes = require('./routes/busRoutes');
// const routeRoutes = require('./routes/routeRoutes');
// const geocodeRoutes = require('./routes/geocodeRoutes'); // <-- NEW

// app.use('/buses', busRoutes);
// app.use('/routes', routeRoutes);
// app.use('/geocode', geocodeRoutes); // <-- NEW

// // Load 1-week simulation JSON
// const simulationData = JSON.parse(
//   fs.readFileSync(path.join(__dirname, 'data', 'busSimulation.json'))
// );
// const routes = simulationData.routes;
// const buses = simulationData.buses;

// // Seed database
// const seedDB = async () => {
//   try {
//     const routeCount = await Route.countDocuments();
//     const busCount = await Bus.countDocuments();

//     if (routeCount === 0) await Route.insertMany(routes);
//     if (busCount === 0) {
//       await Bus.insertMany(
//         buses.map(bus => ({
//           bus_id: bus.bus_id,
//           route_id: bus.route_id,
//           current_location: bus.dailyLocations[0].location,
//           status: bus.dailyLocations[0].status,
//           last_updated: bus.dailyLocations[0].date
//         }))
//       );
//     }

//     console.log('Database seeded with 1-week simulation!');
//   } catch (err) {
//     console.error('Error seeding database:', err);
//   }
// };
// seedDB();

// // Start server
// app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));









// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const fs = require('fs');
// const path = require('path');
// const rateLimit = require('express-rate-limit'); // <-- Added

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB
// connectDB();

// // Import models
// const Bus = require('./models/bus');
// const Route = require('./models/route');

// // Import routes
// const busRoutes = require('./routes/busRoutes');
// const routeRoutes = require('./routes/routeRoutes');

// // Apply rate limiting (100 requests per 15 mins per IP)
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
// });

// app.use('/buses', apiLimiter, busRoutes);
// app.use('/routes', apiLimiter, routeRoutes);

// // Load 1-week simulation JSON
// const simulationData = JSON.parse(
//   fs.readFileSync(path.join(__dirname, 'data', 'busSimulation.json'))
// );
// const routes = simulationData.routes;
// const buses = simulationData.buses;

// // Seed database
// const seedDB = async () => {
//   try {
//     const routeCount = await Route.countDocuments();
//     const busCount = await Bus.countDocuments();

//     if (routeCount === 0) await Route.insertMany(routes);
//     if (busCount === 0) {
//       await Bus.insertMany(
//         buses.map(bus => ({
//           bus_id: bus.bus_id,
//           route_id: bus.route_id,
//           current_location: bus.dailyLocations[0].location,
//           status: bus.dailyLocations[0].status,
//           last_updated: bus.dailyLocations[0].date
//         }))
//       );
//     }

//     console.log('Database seeded with 1-week simulation!');
//   } catch (err) {
//     console.error('Error seeding database:', err);
//   }
// };
// seedDB();

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error('Unexpected error:', err);
//   res.status(500).json({ message: 'Something went wrong. Please try again later.' });
// });

// // Start server
// app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));








// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB
// connectDB();

// // Import models
// const Bus = require('./models/bus');
// const Route = require('./models/route');

// // Import routes
// const busRoutes = require('./routes/busRoutes');
// const routeRoutes = require('./routes/routeRoutes');
// app.use('/buses', busRoutes);
// app.use('/routes', routeRoutes);

// // Load 1-week simulation JSON
// const simulationData = JSON.parse(
//   fs.readFileSync(path.join(__dirname, 'data', 'busSimulation.json'))
// );
// const routes = simulationData.routes;
// const buses = simulationData.buses;

// // Seed database
// const seedDB = async () => {
//   try {
//     const routeCount = await Route.countDocuments();
//     const busCount = await Bus.countDocuments();

//     if (routeCount === 0) await Route.insertMany(routes);
//     if (busCount === 0) {
//       await Bus.insertMany(
//         buses.map(bus => ({
//           bus_id: bus.bus_id,
//           route_id: bus.route_id,
//           current_location: bus.dailyLocations[0].location,
//           status: bus.dailyLocations[0].status,
//           last_updated: bus.dailyLocations[0].date
//         }))
//       );
//     }

//     console.log('Database seeded with 1-week simulation!');
//   } catch (err) {
//     console.error('Error seeding database:', err);
//   }
// };
// seedDB();

// // Start server
// app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));












// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB
// connectDB();

// // Import models
// const Bus = require('./models/bus');
// const Route = require('./models/route');

// // Import routes
// const busRoutes = require('./routes/busRoutes');
// const routeRoutes = require('./routes/routeRoutes');
// app.use('/buses', busRoutes);
// app.use('/routes', routeRoutes);

// // Load 1-week simulation JSON
// const simulationData = JSON.parse(
//   fs.readFileSync(path.join(__dirname, 'data', 'busSimulation.json'))
// );
// const routes = simulationData.routes;
// const buses = simulationData.buses;

// // Seed database
// const seedDB = async () => {
//   try {
//     const routeCount = await Route.countDocuments();
//     const busCount = await Bus.countDocuments();

//     if (routeCount === 0) await Route.insertMany(routes);
//     if (busCount === 0) {
//       await Bus.insertMany(
//         buses.map(bus => ({
//           bus_id: bus.bus_id,
//           route_id: bus.route_id,
//           current_location: bus.dailyLocations[0].location,
//           status: bus.dailyLocations[0].status,
//           last_updated: bus.dailyLocations[0].date
//         }))
//       );
//     }

//     console.log('Database seeded with 1-week simulation!');
//   } catch (err) {
//     console.error('Error seeding database:', err);
//   }
// };
// seedDB();

// // Start server
// app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));







// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB
// connectDB();

// // Import models
// const Bus = require('./models/bus');
// const Route = require('./models/route');

// // Load simulation data
// const simulationData = JSON.parse(
//   fs.readFileSync(path.join(__dirname, 'data', 'busSimulation.json'))
// );
// const routes = simulationData.routes;
// const buses = simulationData.buses;

// // Seed database if empty
// const seedDB = async () => {
//   try {
//     const routeCount = await Route.countDocuments();
//     const busCount = await Bus.countDocuments();

//     if (routeCount === 0) await Route.insertMany(routes);
//     if (busCount === 0) await Bus.insertMany(buses);

//     console.log('Database seeded!');
//   } catch (err) {
//     console.error('Error seeding database:', err);
//   }
// };
// seedDB();

// // Import modular route handlers
// const busRoutes = require('./routes/busRoutes');
// const routeRoutes = require('./routes/routeRoutes');

// app.use('/buses', busRoutes);
// app.use('/routes', routeRoutes);

// // Simulate bus location every 5 seconds
// setInterval(async () => {
//   try {
//     const allBuses = await Bus.find();
//     for (let bus of allBuses) {
//       // Optional: Keep within Sri Lanka bounds
//       bus.current_location.latitude += (Math.random() - 0.5) * 0.01;
//       bus.current_location.longitude += (Math.random() - 0.5) * 0.01;
//       bus.last_updated = new Date();
//       await bus.save();
//     }
//     console.log('Bus locations updated');
//   } catch (err) {
//     console.error('Error updating bus locations:', err);
//   }
// }, 5000);

// // Simulate bus status every 30 seconds
// setInterval(async () => {
//   try {
//     const allBuses = await Bus.find();
//     for (let bus of allBuses) {
//       if (Math.random() < 0.2)
//         bus.status = bus.status === 'On Time' ? 'Delayed' : 'On Time';
//       await bus.save();
//     }
//     console.log('Bus statuses updated');
//   } catch (err) {
//     console.error('Error updating bus statuses:', err);
//   }
// }, 30000);

// // Start the server
// app.listen(PORT, () =>
//   console.log(`API running on http://localhost:${PORT}`)
// );














// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB
// connectDB();

// // Use route files
// const busRoutes = require('./routes/busRoutes');
// const routeRoutes = require('./routes/routeRoutes');

// app.use('/buses', busRoutes);
// app.use('/routes', routeRoutes);

// // Seed DB (optional, keep your previous seed logic if needed)
// //const { routes, buses } = require('./data/seedData');
// const fs = require('fs');
// const path = require('path');

// const simulationData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'busSimulation.json')));
// const routes = simulationData.routes;
// const buses = simulationData.buses;

// const Bus = require('./models/bus');
// const Route = require('./models/route');

// const seedDB = async () => {
//   try {
//     const routeCount = await Route.countDocuments();
//     const busCount = await Bus.countDocuments();

//     if (routeCount === 0) await Route.insertMany(routes);
//     if (busCount === 0) await Bus.insertMany(buses);

//     console.log('Database seeded!');
//   } catch (err) {
//     console.error('Error seeding database:', err);
//   }
// };
// seedDB();

// // Start server
// app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));















// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const { routes, buses } = require('./data/seedData');
// const Bus = require('./models/bus');
// const Route = require('./models/route');

// // Import API routes
// const busRoutes = require('./routes/busRoutes');
// const routeRoutes = require('./routes/routeRoutes');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB
// connectDB();

// // Seed DB if empty
// const seedDB = async () => {
//   try {
//     const routeCount = await Route.countDocuments();
//     const busCount = await Bus.countDocuments();

//     if (routeCount === 0) await Route.insertMany(routes);
//     if (busCount === 0) await Bus.insertMany(buses);

//     console.log('Database seeded!');
//   } catch (err) {
//     console.error('Error seeding database:', err);
//   }
// };
// seedDB();

// // Use modular routes
// app.use('/buses', busRoutes);
// app.use('/routes', routeRoutes);

// // Simulate bus location every 5s
// setInterval(async () => {
//   const allBuses = await Bus.find();
//   for (let bus of allBuses) {
//     bus.current_location.latitude += (Math.random() - 0.5) * 0.01;
//     bus.current_location.longitude += (Math.random() - 0.5) * 0.01;
//     bus.last_updated = new Date();
//     await bus.save();
//   }
//   console.log('Bus locations updated');
// }, 5000);

// // Simulate bus status every 30s
// setInterval(async () => {
//   const allBuses = await Bus.find();
//   for (let bus of allBuses) {
//     if (Math.random() < 0.2) bus.status = bus.status === 'On Time' ? 'Delayed' : 'On Time';
//     await bus.save();
//   }
//   console.log('Bus statuses updated');
// }, 30000);

// // Start server
// app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));






// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const { routes, buses } = require('./data/seedData');
// const Bus = require('./models/bus');
// const Route = require('./models/route');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB
// connectDB();

// // Seed DB if empty
// const seedDB = async () => {
//   try {
//     const routeCount = await Route.countDocuments();
//     const busCount = await Bus.countDocuments();

//     if (routeCount === 0) await Route.insertMany(routes);
//     if (busCount === 0) await Bus.insertMany(buses);

//     console.log('Database seeded!');
//   } catch (err) {
//     console.error('Error seeding database:', err);
//   }
// };
// seedDB();

// // API Endpoints
// app.get('/routes', async (req, res) => {
//   const allRoutes = await Route.find();
//   res.json(allRoutes);
// });

// // Support optional route filtering
// app.get('/buses', async (req, res) => {
//   const { route_id } = req.query;
//   const query = route_id ? { route_id: Number(route_id) } : {};
//   const allBuses = await Bus.find(query);
//   res.json(allBuses);
// });

// // Simulate bus location every 5s
// setInterval(async () => {
//   const allBuses = await Bus.find();
//   for (let bus of allBuses) {
//     bus.current_location.latitude += (Math.random() - 0.5) * 0.01;
//     bus.current_location.longitude += (Math.random() - 0.5) * 0.01;
//     bus.last_updated = new Date();
//     await bus.save();
//   }
//   console.log('Bus locations updated');
// }, 5000);

// // Simulate bus status every 30s
// setInterval(async () => {
//   const allBuses = await Bus.find();
//   for (let bus of allBuses) {
//     if (Math.random() < 0.2) bus.status = bus.status === 'On Time' ? 'Delayed' : 'On Time';
//     await bus.save();
//   }
//   console.log('Bus statuses updated');
// }, 30000);

// app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
