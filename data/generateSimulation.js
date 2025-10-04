// data/generateSimulation.js
const fs = require('fs');
const path = require('path');

// 5 routes (IDs must match DB and frontend)
const routes = [
  { route_id: 101, name: 'Colombo to Kandy' },
  { route_id: 102, name: 'Colombo to Galle' },
  { route_id: 103, name: 'Colombo to Jaffna' },
  { route_id: 104, name: 'Anuradhapura to Colombo' },
  { route_id: 105, name: 'Colombo to Matara' }
];

// SAME polylines as your frontend (public/app.js)
const routesCoordinates = {
  101: [ // Colombo → Kandy
    [6.9319, 79.8478],
    [6.9660, 79.9000],
    [7.0500, 80.0000],
    [7.2000, 80.2000],
    [7.2955, 80.6356]
  ],
  102: [ // Colombo → Galle
    [6.9319, 79.8478],
    [6.8000, 79.9500],
    [6.6000, 80.1000],
    [6.0367, 80.2170]
  ],
  103: [ // Colombo → Jaffna
    [6.9319, 79.8478],
    [7.5000, 79.9000],
    [8.5000, 80.0000],
    [9.6685, 80.0074]
  ],
  104: [ // Anuradhapura → Colombo
    [8.3122, 80.4131],
    [7.9000, 80.2000],
    [7.5000, 80.0000],
    [6.9319, 79.8478]
  ],
  105: [ // Colombo → Matara
    [6.9319, 79.8478],
    [6.7000, 79.9000],
    [6.2000, 80.3000],
    [5.9485, 80.5353]
  ]
};

// Linear interpolation on a polyline
function pointOnPolyline(coords, t) {
  const n = coords.length;
  if (n < 2) return { latitude: coords[0][0], longitude: coords[0][1] };

  const segs = n - 1;
  const x = Math.max(0, Math.min(0.999999, t)) * segs;
  const i = Math.floor(x);
  const localT = x - i;

  const a = coords[i];
  const b = coords[i + 1] || coords[n - 1];

  const lat = a[0] + (b[0] - a[0]) * localT;
  const lng = a[1] + (b[1] - a[1]) * localT;
  return { latitude: lat, longitude: lng };
}

const buses = [];
const days = 7;
const busesPerRoute = 5; // 25 total (as you wanted)

// For nicer spacing, each bus starts at a different t and moves forward daily.
routes.forEach(route => {
  for (let i = 1; i <= busesPerRoute; i++) {
    const bus_id = route.route_id * 100 + i;
    const dailyLocations = [];

    for (let d = 0; d < days; d++) {
      // base position influenced by bus index and day
      // wraps around using % 1
      const t = ( (i - 1) / (busesPerRoute + 1) + d * 0.14 ) % 1; // move ~14% per day
      const location = pointOnPolyline(routesCoordinates[route.route_id], t);

      dailyLocations.push({
        date: new Date(Date.now() + d * 24 * 60 * 60 * 1000),
        location,
        status: Math.random() < 0.8 ? 'On Time' : 'Delayed'
      });
    }

    buses.push({ bus_id, route_id: route.route_id, dailyLocations });
  }
});

const simulationData = { routes, buses };
fs.writeFileSync(
  path.join(__dirname, 'busSimulation.json'),
  JSON.stringify(simulationData, null, 2)
);

console.log('✅ 1-week busSimulation.json created with 25 buses along correct routes.');










// // data/generateSimulation.js
// const fs = require('fs');
// const path = require('path');

// // 5 routes
// const routes = [
//   { route_id: 101, name: 'Colombo to Kandy' },
//   { route_id: 102, name: 'Colombo to Galle' },
//   { route_id: 103, name: 'Colombo to Jaffna' },
//   { route_id: 104, name: 'Colombo to Anuradhapura' },
//   { route_id: 105, name: 'Colombo to Matara' }
// ];

// // Start locations per route (rough)
// const routeStartLocations = {
//   101: { lat: 6.9319, lng: 79.8478 }, // Colombo
//   102: { lat: 6.9319, lng: 79.8478 },
//   103: { lat: 6.9319, lng: 79.8478 },
//   104: { lat: 6.9319, lng: 79.8478 },
//   105: { lat: 6.9319, lng: 79.8478 }
// };

// const buses = [];
// const days = 7;

// // ***** CHANGE HERE: 5 buses per route = 25 total *****
// routes.forEach(route => {
//   for (let i = 1; i <= 5; i++) {
//     const bus_id = route.route_id * 100 + i;
//     const dailyLocations = [];

//     for (let d = 0; d < days; d++) {
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

// const simulationData = { routes, buses };
// fs.writeFileSync(
//   path.join(__dirname, 'busSimulation.json'),
//   JSON.stringify(simulationData, null, 2)
// );

// console.log('✅ 1-week bus simulation JSON created with 25 buses.');
