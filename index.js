const express = require('express');
const path = require('path');
const Bus = require('./models/bus');
const Route = require('./models/route');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoints

// Get all buses
app.get('/buses', async (req, res) => {
  try {
    const buses = await Bus.find();
    if (!buses || buses.length === 0) return res.status(404).send('No buses found');
    res.json(buses);
  } catch (err) {
    console.error('Error fetching buses:', err);
    res.status(500).send('Error fetching buses');
  }
});

// Get all routes
app.get('/routes', async (req, res) => {
  try {
    const routes = await Route.find();
    if (!routes || routes.length === 0) return res.status(404).send('No routes found');
    res.json(routes);
  } catch (err) {
    console.error('Error fetching routes:', err);
    res.status(500).send('Error fetching routes');
  }
});

// Get a specific bus
app.get('/buses/:bus_id', async (req, res) => {
  try {
    const bus = await Bus.findOne({ bus_id: req.params.bus_id });
    if (!bus) return res.status(404).send('Bus not found');
    res.json(bus);
  } catch (err) {
    console.error('Error fetching bus details:', err);
    res.status(500).send('Error fetching bus details');
  }
});

// Get bus location
app.get('/buses/:bus_id/location', async (req, res) => {
  try {
    const bus = await Bus.findOne({ bus_id: req.params.bus_id });
    if (!bus) return res.status(404).send('Bus not found');
    res.json({ bus_id: bus.bus_id, location: bus.current_location, status: bus.status });
  } catch (err) {
    console.error('Error fetching bus location:', err);
    res.status(500).send('Error fetching bus location');
  }
});

// Real-time bus location & status simulation
async function updateBusLocations() {
  try {
    const buses = await Bus.find();
    if (!buses || buses.length === 0) return;

    for (let bus of buses) {
      // Random movement
      bus.current_location.latitude += (Math.random() * 0.01 - 0.005);
      bus.current_location.longitude += (Math.random() * 0.01 - 0.005);

      // Random status update (20% chance)
      if (Math.random() < 0.2) {
        bus.status = bus.status === 'On Time' ? 'Delayed' : 'On Time';
      }

      bus.last_updated = new Date();
      await bus.save();
      console.log(`Bus ${bus.bus_id} updated: ${bus.status}`, bus.current_location);
    }
  } catch (err) {
    console.error('Error updating bus locations:', err);
  }
}

// Update buses every 5 seconds
setInterval(updateBusLocations, 5000);

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(5000, () => {
  console.log('API running on http://localhost:5000');
});
























// // Importing required libraries
// const express = require('express');
// const mongoose = require('mongoose');
// const path = require('path');
// const Bus = require('./models/bus'); // Import Bus model
// const Route = require('./models/route'); // Import Route model
// require('dotenv').config(); // To load environment variables from .env file

// // Create an Express application
// const app = express();

// // MongoDB connection string from .env file
// const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bus_tracking';

// // Connect to MongoDB
// mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('MongoDB connected successfully'))
//   .catch(err => console.error('Error connecting to MongoDB:', err));

// // Middleware to parse JSON
// app.use(express.json());

// // Serve static files (front-end)
// app.use(express.static(path.join(__dirname, 'public')));

// // 1. GET /buses: List all buses (from MongoDB)
// app.get('/buses', async (req, res) => {
//   try {
//     const buses = await Bus.find(); // Fetch buses from MongoDB
//     if (!buses || buses.length === 0) {
//       return res.status(404).send('No buses found');
//     }
//     res.json(buses); // Send the buses as JSON
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//     res.status(500).send('Error fetching buses');
//   }
// });

// // 2. GET /routes: List all routes (from MongoDB)
// app.get('/routes', async (req, res) => {
//   try {
//     const routes = await Route.find(); // Fetch routes from MongoDB
//     if (!routes || routes.length === 0) {
//       return res.status(404).send('No routes found');
//     }
//     res.json(routes); // Send the routes as JSON
//   } catch (err) {
//     console.error('Error fetching routes:', err);
//     res.status(500).send('Error fetching routes');
//   }
// });

// // 3. GET /buses/:bus_id: Get details of a specific bus (from MongoDB)
// app.get('/buses/:bus_id', async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: req.params.bus_id });
//     if (!bus) {
//       return res.status(404).send('Bus not found');
//     }
//     res.json(bus);
//   } catch (err) {
//     console.error('Error fetching bus details:', err);
//     res.status(500).send('Error fetching bus details');
//   }
// });

// // 4. GET /buses/:bus_id/location: Get the current location of a specific bus (from MongoDB)
// app.get('/buses/:bus_id/location', async (req, res) => {
//   try {
//     const bus = await Bus.findOne({ bus_id: req.params.bus_id });
//     if (!bus) {
//       return res.status(404).send('Bus not found');
//     }
//     res.json({ bus_id: bus.bus_id, location: bus.current_location });
//   } catch (err) {
//     console.error('Error fetching bus location:', err);
//     res.status(500).send('Error fetching bus location');
//   }
// });

// // 5. Simulate real-time bus location updates
// async function updateBusLocations() {
//   try {
//     // Fetch all buses
//     const buses = await Bus.find();

//     if (!buses || buses.length === 0) {
//       console.log('No buses found for update');
//       return;
//     }

//     // Loop over each bus
//     for (let bus of buses) {
//       // Simulate small random movement
//       bus.current_location.latitude += (Math.random() * 0.01 - 0.005);  // random move +/- 0.005
//       bus.current_location.longitude += (Math.random() * 0.01 - 0.005);

//       bus.last_updated = new Date();

//       // Save updated bus to DB
//       await bus.save();
//       console.log(`Bus ${bus.bus_id} location updated:`, bus.current_location);
//     }

//   } catch (err) {
//     console.error('Error updating bus locations:', err);
//   }
// }

// // Run every 5 seconds
// setInterval(updateBusLocations, 2000);



// // 5. Simulate real-time bus location updates
// async function updateBusLocations() {
//   try {
//     // Fetch all buses from MongoDB (use async/await instead of callbacks)
//     const buses = await Bus.find(); // Fetch buses from MongoDB

//     if (buses.length === 0) {
//       console.log('No buses found');
//       return;
//     }

//     buses.forEach(bus => {
//       // Simulate slight changes in location (latitude and longitude)
//       const newLatitude = bus.current_location.latitude + (Math.random() * 0.01); // Simulate a small change in latitude
//       const newLongitude = bus.current_location.longitude + (Math.random() * 0.01); // Simulate a small change in longitude

//       // Update bus location in the database
//       bus.current_location = { latitude: newLatitude, longitude: newLongitude };
//       bus.last_updated = new Date(); // Update the last_updated timestamp

//       // Save updated bus data
//       bus.save()
//         .then(() => {
//           console.log(`Bus ${bus.bus_id} location updated:`, bus.current_location);
//         })
//         .catch(err => {
//           console.error('Error updating bus location:', err);
//         });
//     });
//   } catch (err) {
//     console.error('Error fetching buses for location update:', err);
//   }
// }

// // Update bus locations every 5 seconds
// setInterval(updateBusLocations, 5000); // 5000 ms = 5 seconds




// // 5. Simulate real-time bus location updates
// function updateBusLocations() {
//   Bus.find({}, (err, buses) => {
//     if (err) {
//       console.error('Error fetching buses for location update:', err);
//       return;
//     }

//     buses.forEach(bus => {
//       // Simulate slight changes in location (latitude and longitude)
//       const newLatitude = bus.current_location.latitude + (Math.random() * 0.01); // Simulate a small change in latitude
//       const newLongitude = bus.current_location.longitude + (Math.random() * 0.01); // Simulate a small change in longitude

//       // Update bus location in the database
//       bus.current_location = { latitude: newLatitude, longitude: newLongitude };
//       bus.last_updated = new Date(); // Update the last_updated timestamp

//       // Save updated bus data
//       bus.save((err) => {
//         if (err) {
//           console.error('Error updating bus location:', err);
//         } else {
//           console.log(`Bus ${bus.bus_id} location updated:`, bus.current_location);
//         }
//       });
//     });
//   });
// }

// // Update bus locations every 5 seconds
// setInterval(updateBusLocations, 5000); // 5000 ms = 5 seconds

// Serve the index.html file when accessing the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server on port 5000
app.listen(5000, () => {
  console.log('API is running on http://localhost:5000');
});



// // index.js
// const express = require('express');
// const connectDB = require('./config/db');
// const Bus = require('./models/bus');
// const Route = require('./models/route');
// const path = require('path');

// // Initialize Express app
// const app = express();

// // Connect to MongoDB
// connectDB();

// // Middleware to parse JSON
// app.use(express.json());

// // Serve static files (front-end)
// app.use(express.static(path.join(__dirname, 'public')));

// // Sample route: Fetch all buses
// app.get('/buses', async (req, res) => {
//   try {
//     const buses = await Bus.find(); // Fetch buses from MongoDB
//     if (!buses || buses.length === 0) {
//       return res.status(404).send('No buses found');
//     }
//     res.json(buses); // Return the buses as JSON
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//     res.status(500).send('Error fetching buses');
//   }
// });

// // Sample route: Fetch all routes
// app.get('/routes', async (req, res) => {
//   try {
//     const routes = await Route.find(); // Fetch routes from MongoDB
//     if (!routes || routes.length === 0) {
//       return res.status(404).send('No routes found');
//     }
//     res.json(routes); // Return the routes as JSON
//   } catch (err) {
//     console.error('Error fetching routes:', err);
//     res.status(500).send('Error fetching routes');
//   }
// });

// // Root route: Serve index.html
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Start server on port 5000
// app.listen(5000, () => {
//   console.log('API is running on http://localhost:5000');
// });
