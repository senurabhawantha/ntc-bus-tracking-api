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
  { "bus_id": 6, "route_id": 106, "status": "On Time", "current_location": { "latitude": 7.8751, "longitude": 80.6454 } },
  { "bus_id": 7, "route_id": 107, "status": "Delayed", "current_location": { "latitude": 6.9933, "longitude": 80.2322 } },
  { "bus_id": 8, "route_id": 108, "status": "On Time", "current_location": { "latitude": 6.9450, "longitude": 80.3030 } },
  { "bus_id": 9, "route_id": 109, "status": "On Time", "current_location": { "latitude": 9.2805, "longitude": 80.4351 } },
  { "bus_id": 10, "route_id": 110, "status": "Delayed", "current_location": { "latitude": 7.5300, "longitude": 80.1444 } },
  { "bus_id": 11, "route_id": 111, "status": "On Time", "current_location": { "latitude": 8.0987, "longitude": 81.0461 } },
  { "bus_id": 12, "route_id": 112, "status": "On Time", "current_location": { "latitude": 6.7171, "longitude": 79.9624 } },
  { "bus_id": 13, "route_id": 113, "status": "Delayed", "current_location": { "latitude": 6.8285, "longitude": 80.1156 } },
  { "bus_id": 14, "route_id": 114, "status": "On Time", "current_location": { "latitude": 9.3510, "longitude": 80.4711 } },
  { "bus_id": 15, "route_id": 115, "status": "Delayed", "current_location": { "latitude": 7.7834, "longitude": 80.3489 } },
  { "bus_id": 16, "route_id": 116, "status": "On Time", "current_location": { "latitude": 7.8347, "longitude": 79.9609 } },
  { "bus_id": 17, "route_id": 117, "status": "On Time", "current_location": { "latitude": 6.9253, "longitude": 79.8605 } },
  { "bus_id": 18, "route_id": 118, "status": "Delayed", "current_location": { "latitude": 6.8323, "longitude": 80.2113 } },
  { "bus_id": 19, "route_id": 119, "status": "On Time", "current_location": { "latitude": 9.4983, "longitude": 80.6429 } },
  { "bus_id": 20, "route_id": 120, "status": "Delayed", "current_location": { "latitude": 7.1650, "longitude": 80.2580 } },
  { "bus_id": 21, "route_id": 121, "status": "On Time", "current_location": { "latitude": 8.5087, "longitude": 81.1315 } },
  { "bus_id": 22, "route_id": 122, "status": "On Time", "current_location": { "latitude": 6.9704, "longitude": 80.0183 } },
  { "bus_id": 23, "route_id": 123, "status": "Delayed", "current_location": { "latitude": 8.3581, "longitude": 80.6640 } },
  { "bus_id": 24, "route_id": 124, "status": "On Time", "current_location": { "latitude": 7.8901, "longitude": 80.5130 } },
  { "bus_id": 25, "route_id": 125, "status": "Delayed", "current_location": { "latitude": 8.2221, "longitude": 80.3821 } }
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
