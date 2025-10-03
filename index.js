require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit'); // <-- Added

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Import models
const Bus = require('./models/bus');
const Route = require('./models/route');

// Import routes
const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');

// Apply rate limiting (100 requests per 15 mins per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use('/buses', apiLimiter, busRoutes);
app.use('/routes', apiLimiter, routeRoutes);

// Load 1-week simulation JSON
const simulationData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'busSimulation.json'))
);
const routes = simulationData.routes;
const buses = simulationData.buses;

// Seed database
const seedDB = async () => {
  try {
    const routeCount = await Route.countDocuments();
    const busCount = await Bus.countDocuments();

    if (routeCount === 0) await Route.insertMany(routes);
    if (busCount === 0) {
      await Bus.insertMany(
        buses.map(bus => ({
          bus_id: bus.bus_id,
          route_id: bus.route_id,
          current_location: bus.dailyLocations[0].location,
          status: bus.dailyLocations[0].status,
          last_updated: bus.dailyLocations[0].date
        }))
      );
    }

    console.log('Database seeded with 1-week simulation!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};
seedDB();

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ message: 'Something went wrong. Please try again later.' });
});

// Start server
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));








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
