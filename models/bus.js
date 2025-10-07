// models/bus.js
const mongoose = require('mongoose');

const dailyLocationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  location: {
    latitude: Number,
    longitude: Number
  },
  status: { type: String, enum: ['On Time', 'Delayed'], default: 'On Time' }
}, { _id: false });

const busSchema = new mongoose.Schema({
  bus_id: { type: Number, unique: true, index: true },
  route_id: Number,
  status: { type: String, enum: ['On Time', 'Delayed'], default: 'On Time' }, // current (today) status
  current_location: {
    latitude: Number,
    longitude: Number
  }, // current (today) location
  last_updated: { type: Date, default: Date.now },

  // NEW: the 7-day schedule (today + next 6 days)
  dailyLocations: { type: [dailyLocationSchema], default: [] }
});

module.exports = mongoose.models.Bus || mongoose.model('Bus', busSchema);





