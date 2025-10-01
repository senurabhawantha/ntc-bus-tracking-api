// models/bus.js
const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  bus_id: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  route_id: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['On Time', 'Delayed'] 
  },
  current_location: {
    latitude: { 
      type: Number, 
      required: true 
    },
    longitude: { 
      type: Number, 
      required: true 
    }
  },
  last_updated: { 
    type: Date, 
    default: Date.now 
  }
});

const Bus = mongoose.model('Bus', busSchema);

module.exports = Bus;
