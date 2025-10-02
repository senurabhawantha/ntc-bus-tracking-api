const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  bus_id: { type: Number, unique: true },
  route_id: Number,
  status: { type: String, enum: ['On Time', 'Delayed'], default: 'On Time' },
  current_location: {
    latitude: Number,
    longitude: Number
  },
  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Bus || mongoose.model('Bus', busSchema);
