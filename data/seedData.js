const mongoose = require('mongoose');
const Bus = require('../models/bus');
const Route = require('../models/route');

// MongoDB connection string (use your own URI)
const mongoUri = 'mongodb+srv://senurabawantha_db_user:koOuQbtRbIJcI4sd@bus-traking-api.hxctmjs.mongodb.net/bus-traicking-api?retryWrites=true&w=majority&appName=bus-traking-api';

// Routes data (5 routes)
const routesData = [
  { "route_id": 101, "route_name": "Colombo to Kandy" },
  { "route_id": 102, "route_name": "Colombo to Galle" },
  { "route_id": 103, "route_name": "Colombo to Jaffna" },
  { "route_id": 104, "route_name": "Colombo to Anuradhapura" },
  { "route_id": 105, "route_name": "Colombo to Matara" }
];

// Buses data (25 buses)
const busesData = [
  { "bus_id": 1, "route_id": 101, "status": "On Time", "current_location": { "latitude": 6.9271, "longitude": 79.8612 } },
  { "bus_id": 2, "route_id": 102, "status": "Delayed", "current_location": { "latitude": 6.9281, "longitude": 79.8672 } },
  { "bus_id": 3, "route_id": 103, "status": "On Time", "current_location": { "latitude": 9.6625, "longitude": 80.0214 } },
  { "bus_id": 4, "route_id": 104, "status": "Delayed", "current_location": { "latitude": 8.3110, "longitude": 80.4068 } },
  { "bus_id": 5, "route_id": 105, "status": "On Time", "current_location": { "latitude": 5.9790, "longitude": 80.2195 } },
  // Add 20 more buses to make it 25 total
];

// Connect to MongoDB
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB for seeding data');
    
    // Insert routes data
    Route.insertMany(routesData)
      .then(() => {
        console.log('Routes data inserted successfully');
        
        // Insert buses data
        Bus.insertMany(busesData)
          .then(() => {
            console.log('Buses data inserted successfully');
            mongoose.disconnect(); // Disconnect after insertion
          })
          .catch(err => console.error('Error inserting buses data:', err));
      })
      .catch(err => console.error('Error inserting routes data:', err));
  })
  .catch(err => console.error('Error connecting to MongoDB:', err));
