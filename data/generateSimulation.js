// data/generateSimulation.js
const fs = require('fs');
const path = require('path');

// 5 routes
const routes = [
  { route_id: 101, name: 'Colombo to Kandy' },
  { route_id: 102, name: 'Colombo to Galle' },
  { route_id: 103, name: 'Colombo to Jaffna' },
  { route_id: 104, name: 'Colombo to Anuradhapura' },
  { route_id: 105, name: 'Colombo to Matara' }
];

// Start locations per route (rough)
const routeStartLocations = {
  101: { lat: 6.9319, lng: 79.8478 }, // Colombo
  102: { lat: 6.9319, lng: 79.8478 },
  103: { lat: 6.9319, lng: 79.8478 },
  104: { lat: 6.9319, lng: 79.8478 },
  105: { lat: 6.9319, lng: 79.8478 }
};

const buses = [];
const days = 7;

// ***** CHANGE HERE: 5 buses per route = 25 total *****
routes.forEach(route => {
  for (let i = 1; i <= 5; i++) {
    const bus_id = route.route_id * 100 + i;
    const dailyLocations = [];

    for (let d = 0; d < days; d++) {
      const latOffset = (Math.random() - 0.5) * 0.05;
      const lngOffset = (Math.random() - 0.5) * 0.05;

      dailyLocations.push({
        date: new Date(Date.now() + d * 24 * 60 * 60 * 1000),
        location: {
          latitude: routeStartLocations[route.route_id].lat + latOffset,
          longitude: routeStartLocations[route.route_id].lng + lngOffset
        },
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
fs.writeFileSync(
  path.join(__dirname, 'busSimulation.json'),
  JSON.stringify(simulationData, null, 2)
);

console.log('✅ 1-week bus simulation JSON created with 25 buses.');
