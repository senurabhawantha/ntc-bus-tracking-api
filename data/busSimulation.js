const fs = require('fs');

// Define routes with basic start & end coordinates
const routes = [
  { route_id: 101, name: 'Colombo to Kandy', coordinates: [[6.9319, 79.8478], [7.2955, 80.6356]] },
  { route_id: 102, name: 'Colombo to Galle', coordinates: [[6.9319, 79.8478], [6.0367, 80.217]] },
  { route_id: 103, name: 'Colombo to Jaffna', coordinates: [[6.9319, 79.8478], [9.6685, 80.0074]] },
  { route_id: 104, name: 'Colombo to Anuradhapura', coordinates: [[6.9319, 79.8478], [8.3122, 80.4131]] },
  { route_id: 105, name: 'Colombo to Matara', coordinates: [[6.9319, 79.8478], [5.9485, 80.5353]] },
];

const buses = [];

// Helper to generate a random point along a line
function randomPointBetween(start, end) {
  const lat = start[0] + Math.random() * (end[0] - start[0]);
  const lng = start[1] + Math.random() * (end[1] - start[1]);
  return { latitude: lat, longitude: lng };
}

// Generate 50 buses per route
routes.forEach(route => {
  for (let i = 1; i <= 50; i++) {
    buses.push({
      bus_id: route.route_id * 100 + i,
      route_id: route.route_id,
      status: Math.random() < 0.8 ? 'On Time' : 'Delayed', // 80% on-time, 20% delayed
      current_location: randomPointBetween(route.coordinates[0], route.coordinates[1]),
      last_updated: new Date()
    });
  }
});

// Save to JSON file
fs.writeFileSync('busSimulation.json', JSON.stringify({ routes, buses }, null, 2));
console.log('busSimulation.json created with 50 buses per route!');















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
