const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  route_id: { type: Number, unique: true },
  name: String
});

module.exports = mongoose.models.Route || mongoose.model('Route', routeSchema);
