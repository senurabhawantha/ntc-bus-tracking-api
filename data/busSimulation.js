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

