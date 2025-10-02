const routes = [
  { route_id: 101, name: 'Colombo to Kandy' },
  { route_id: 102, name: 'Colombo to Galle' },
  { route_id: 103, name: 'Colombo to Jaffna' },
  { route_id: 104, name: 'Colombo to Anuradhapura' },
  { route_id: 105, name: 'Colombo to Matara' }
];

const buses = [];

routes.forEach(route => {
  for (let i = 1; i <= 15; i++) {
    buses.push({
      bus_id: route.route_id * 100 + i,
      route_id: route.route_id,
      status: Math.random() < 0.5 ? 'On Time' : 'Delayed',
      current_location: {
        latitude: 6.9271 + Math.random() * 0.05,
        longitude: 79.8612 + Math.random() * 0.05
      },
      last_updated: new Date()
    });
  }
});

module.exports = { routes, buses };
