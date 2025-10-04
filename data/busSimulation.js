const fs = require('fs');
const path = require('path');

// Define routes
const routes = [
  { route_id: 101, name: 'Colombo to Kandy' },
  { route_id: 102, name: 'Colombo to Galle' },
  { route_id: 103, name: 'Colombo to Matara' },
  { route_id: 104, name: 'Colombo to Jaffna' },
  { route_id: 105, name: 'Anuradhapura to Colombo' }
];

// Realistic polyline coordinates for the routes
const routesCoordinates = {
  101: [[6.9319,79.8478],[6.966,79.900],[7.050,80.000],[7.200,80.200],[7.2955,80.6356]],
  102: [[6.9319,79.8478],[6.800,79.950],[6.600,80.100],[6.0367,80.217]],
  103: [[6.9319,79.8478],[6.700,79.900],[6.200,80.300],[5.9485,80.5353]],
  104: [[6.9319,79.8478],[7.500,79.900],[8.500,80.000],[9.6685,80.0074]],
  105: [[8.3122,80.4131],[7.900,80.200],[7.500,80.000],[6.9319,79.8478]]
};

// Function to get interpolated coordinates along a polyline
function getPointOnPolyline(coords, t) {
  const totalSegments = coords.length - 1;
  const segmentIndex = Math.floor(t * totalSegments);
  const segmentT = (t * totalSegments) - segmentIndex;
  const start = coords[segmentIndex];
  const end = coords[segmentIndex + 1] || coords[coords.length - 1];
  const lat = start[0] + (end[0] - start[0]) * segmentT;
  const lng = start[1] + (end[1] - start[1]) * segmentT;
  return { latitude: lat, longitude: lng };
}

const buses = [];
const days = 7; // 1-week simulation
const busesPerRoute = 10; // 5 routes x 10 buses = 50 buses

routes.forEach(route => {
  for (let i = 1; i <= busesPerRoute; i++) {
    const bus_id = route.route_id * 100 + i;
    const dailyLocations = [];

    for (let d = 0; d < days; d++) {
      // Spread buses along the polyline
      const t = Math.random(); // position along the route (0 to 1)
      const location = getPointOnPolyline(routesCoordinates[route.route_id], t);

      dailyLocations.push({
        date: new Date(Date.now() + d * 24 * 60 * 60 * 1000),
        location,
        status: Math.random() < 0.8 ? 'On Time' : 'Delayed'
      });
    }

    buses.push({
      bus_id,
      route_id: route.route_id,
      dailyLocations
    });
  }
});

const simulationData = { routes, buses };

// Save to JSON
fs.writeFileSync(path.join(__dirname, 'busSimulation.json'), JSON.stringify(simulationData, null, 2));
console.log('✅ 1-week realistic busSimulation.json created with 50 buses!');








// const fs = require('fs');
// const path = require('path');

// // Define routes
// const routes = [
//   { route_id: 101, name: 'Colombo to Kandy' },
//   { route_id: 102, name: 'Colombo to Galle' },
//   { route_id: 103, name: 'Colombo to Jaffna' },
//   { route_id: 104, name: 'Colombo to Anuradhapura' },
//   { route_id: 105, name: 'Colombo to Matara' }
// ];

// // Define start locations for each route
// const routeStartLocations = {
//   101: { lat: 6.9319, lng: 79.8478 }, // Colombo
//   102: { lat: 6.9319, lng: 79.8478 },
//   103: { lat: 6.9319, lng: 79.8478 },
//   104: { lat: 6.9319, lng: 79.8478 },
//   105: { lat: 6.9319, lng: 79.8478 }
// };

// const buses = [];
// const days = 7;

// // Generate 50 buses distributed across routes
// routes.forEach(route => {
//   for (let i = 1; i <= 10; i++) { // 10 buses per route → 5 routes x 10 = 50
//     const bus_id = route.route_id * 100 + i;
//     const dailyLocations = [];

//     for (let d = 0; d < days; d++) {
//       // Randomly move along small offsets to simulate the route
//       const latOffset = (Math.random() - 0.5) * 0.05;
//       const lngOffset = (Math.random() - 0.5) * 0.05;

//       dailyLocations.push({
//         date: new Date(Date.now() + d * 24 * 60 * 60 * 1000),
//         location: {
//           latitude: routeStartLocations[route.route_id].lat + latOffset,
//           longitude: routeStartLocations[route.route_id].lng + lngOffset
//         },
//         status: Math.random() < 0.8 ? 'On Time' : 'Delayed'
//       });
//     }

//     buses.push({
//       bus_id,
//       route_id: route.route_id,
//       dailyLocations
//     });
//   }
// });

// // Save JSON
// const simulationData = { routes, buses };
// fs.writeFileSync(path.join(__dirname, 'busSimulation.json'), JSON.stringify(simulationData, null, 2));

// console.log('1-week bus simulation JSON created!');















// const fs = require('fs');

// // Define routes with basic start & end coordinates
// const routes = [
//   { route_id: 101, name: 'Colombo to Kandy', coordinates: [[6.9319, 79.8478], [7.2955, 80.6356]] },
//   { route_id: 102, name: 'Colombo to Galle', coordinates: [[6.9319, 79.8478], [6.0367, 80.217]] },
//   { route_id: 103, name: 'Colombo to Jaffna', coordinates: [[6.9319, 79.8478], [9.6685, 80.0074]] },
//   { route_id: 104, name: 'Colombo to Anuradhapura', coordinates: [[6.9319, 79.8478], [8.3122, 80.4131]] },
//   { route_id: 105, name: 'Colombo to Matara', coordinates: [[6.9319, 79.8478], [5.9485, 80.5353]] },
// ];

// const buses = [];

// // Helper to generate a random point along a line
// function randomPointBetween(start, end) {
//   const lat = start[0] + Math.random() * (end[0] - start[0]);
//   const lng = start[1] + Math.random() * (end[1] - start[1]);
//   return { latitude: lat, longitude: lng };
// }

// // Generate 50 buses per route
// routes.forEach(route => {
//   for (let i = 1; i <= 50; i++) {
//     buses.push({
//       bus_id: route.route_id * 100 + i,
//       route_id: route.route_id,
//       status: Math.random() < 0.8 ? 'On Time' : 'Delayed', // 80% on-time, 20% delayed
//       current_location: randomPointBetween(route.coordinates[0], route.coordinates[1]),
//       last_updated: new Date()
//     });
//   }
// });

// // Save to JSON file
// fs.writeFileSync('busSimulation.json', JSON.stringify({ routes, buses }, null, 2));
// console.log('busSimulation.json created with 50 buses per route!');















// // busSimulation.js
// const fs = require('fs');

// // Define your routes with start and end coordinates
// const routes = [
//   { route_id: 101, name: 'Colombo to Kandy', start: [6.9319, 79.8478], end: [7.2955, 80.6356] },
//   { route_id: 102, name: 'Colombo to Galle', start: [6.9319, 79.8478], end: [6.0367, 80.217] },
//   { route_id: 103, name: 'Colombo to Matara', start: [6.9319, 79.8478], end: [5.9485, 80.5353] },
//   { route_id: 104, name: 'Colombo to Jaffna', start: [6.9319, 79.8478], end: [9.6685, 80.0074] },
//   { route_id: 105, name: 'Anuradhapura to Colombo', start: [8.3122, 80.4131], end: [6.9319, 79.8478] },
// ];

// const buses = [];
// const startDate = new Date(); // today
// const hoursPerWeek = 24 * 7; // 1 week

// function interpolate(start, end, fraction) {
//   return start + (end - start) * fraction;
// }

// // Generate buses and their 1-week schedule
// routes.forEach(route => {
//   for (let i = 1; i <= 10; i++) { // 10 buses per route => 50 buses
//     const bus_id = route.route_id * 100 + i;
//     const schedule = [];

//     for (let h = 0; h < hoursPerWeek; h++) {
//       const fraction = h / hoursPerWeek; // 0 → 1 along route
//       const lat = interpolate(route.start[0], route.end[0], fraction);
//       const lng = interpolate(route.start[1], route.end[1], fraction);
//       const status = Math.random() < 0.8 ? 'On Time' : 'Delayed'; // 80% on-time
//       const time = new Date(startDate.getTime() + h * 3600000); // increment by 1 hour

//       schedule.push({ time: time.toISOString(), lat, lng, status });
//     }

//     buses.push({ bus_id, route_id: route.route_id, schedule });
//   }
// });

// // Save to JSON for easy seeding
// fs.writeFileSync('busSimulation.json', JSON.stringify(buses, null, 2));
// console.log('busSimulation.json generated with 50 buses for 1 week!');
