const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  route_id: { type: Number, required: true, unique: true },
  route_name: { type: String, required: true }
});

const Route = mongoose.model('Route', routeSchema);
module.exports = Route;























// // models/route.js
// const mongoose = require('mongoose');

// const routeSchema = new mongoose.Schema({
//   route_id: { 
//     type: Number, 
//     required: true, 
//     unique: true 
//   },
//   route_name: { 
//     type: String, 
//     required: true 
//   }
// });

// const Route = mongoose.model('Route', routeSchema);

// module.exports = Route;
