// index.js
const express = require('express');
const connectDB = require('./config/db');
const Bus = require('./models/bus');
const Route = require('./models/route');
const path = require('path');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Serve static files (front-end)
app.use(express.static(path.join(__dirname, 'public')));

// Sample route: Fetch all buses
app.get('/buses', async (req, res) => {
  try {
    const buses = await Bus.find(); // Fetch buses from MongoDB
    if (!buses || buses.length === 0) {
      return res.status(404).send('No buses found');
    }
    res.json(buses); // Return the buses as JSON
  } catch (err) {
    console.error('Error fetching buses:', err);
    res.status(500).send('Error fetching buses');
  }
});

// Sample route: Fetch all routes
app.get('/routes', async (req, res) => {
  try {
    const routes = await Route.find(); // Fetch routes from MongoDB
    if (!routes || routes.length === 0) {
      return res.status(404).send('No routes found');
    }
    res.json(routes); // Return the routes as JSON
  } catch (err) {
    console.error('Error fetching routes:', err);
    res.status(500).send('Error fetching routes');
  }
});

// Root route: Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server on port 5000
app.listen(5000, () => {
  console.log('API is running on http://localhost:5000');
});
