let map;
let markers = [];
let currentRouteId = 'all';

// Bus icons
const busIcons = {
  onTime: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/18042/18042856.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  delayed: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/18357/18357012.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  })
};

// Example realistic polyline coordinates for routes (add more intermediate points for smooth roads)
const routesCoordinates = {
  101: [ // Colombo → Kandy
    [6.9319, 79.8478],
    [6.966, 79.900],
    [7.050, 80.000],
    [7.200, 80.200],
    [7.2955, 80.6356]
  ],
  102: [ // Colombo → Galle
    [6.9319, 79.8478],
    [6.800, 79.950],
    [6.600, 80.100],
    [6.0367, 80.217]
  ],
  103: [ // Colombo → Matara
    [6.9319, 79.8478],
    [6.700, 79.900],
    [6.200, 80.300],
    [5.9485, 80.5353]
  ],
  104: [ // Colombo → Jaffna
    [6.9319, 79.8478],
    [7.500, 79.900],
    [8.500, 80.000],
    [9.6685, 80.0074]
  ],
  105: [ // Anuradhapura → Colombo
    [8.3122, 80.4131],
    [7.900, 80.200],
    [7.500, 80.000],
    [6.9319, 79.8478]
  ]
};

// Keep track of each bus position along the polyline
const busPositions = {}; // { bus_id: indexAlongPolyline (0..1) }

// Fetch routes for dropdown
async function fetchRoutes() {
  const res = await fetch('/routes');
  const routes = await res.json();
  const select = document.getElementById('routeSelect');

  // Add "All Routes" option
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Routes';
  select.appendChild(allOption);

  routes.forEach(route => {
    const option = document.createElement('option');
    option.value = route.route_id;
    option.textContent = route.name;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    currentRouteId = select.value;
    fetchBuses();
  });

  select.selectedIndex = 0;
  fetchBuses();
}

// Get bus position along polyline
function getPositionAlongPolyline(routeId, t) {
  const coords = routesCoordinates[routeId];
  if (!coords) return coords ? coords[0] : [6.9271, 79.8612];

  // Linear interpolation along multiple segments
  const totalSegments = coords.length - 1;
  const segmentIndex = Math.floor(t * totalSegments);
  const segmentT = (t * totalSegments) - segmentIndex;

  const start = coords[segmentIndex];
  const end = coords[segmentIndex + 1] || coords[coords.length - 1];

  const lat = start[0] + (end[0] - start[0]) * segmentT;
  const lng = start[1] + (end[1] - start[1]) * segmentT;
  return [lat, lng];
}

// Fetch buses and update map/table
async function fetchBuses() {
  try {
    const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
    const buses = await res.json();
    updateMapAndList(buses);
  } catch (err) {
    console.error('Error fetching buses:', err);
  }
}

// Update map markers and table
function updateMapAndList(routeBuses) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const tableBody = document.getElementById('busList');
  tableBody.innerHTML = '';

  routeBuses.forEach(bus => {
    if (!busPositions[bus.bus_id]) busPositions[bus.bus_id] = Math.random() * 0.05; // start near beginning

    busPositions[bus.bus_id] += 0.002 + Math.random() * 0.003; // move along polyline
    if (busPositions[bus.bus_id] > 1) busPositions[bus.bus_id] = 0; // loop back

    const [lat, lng] = getPositionAlongPolyline(bus.route_id, busPositions[bus.bus_id]);
    const busIcon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;

    const marker = L.marker([lat, lng], { icon: busIcon })
      .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
      .addTo(map);
    markers.push(marker);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${bus.bus_id}</td>
      <td>${bus.route_id}</td>
      <td class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</td>
      <td>${lat.toFixed(5)}</td>
      <td>${lng.toFixed(5)}</td>
      <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Draw polylines for all routes
function drawPolylines() {
  for (const routeId in routesCoordinates) {
    L.polyline(routesCoordinates[routeId], { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
  }
}

// Initialize map
function initMap() {
  map = L.map('map').setView([7.8731, 80.7718], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  drawPolylines();
}

// Map legend
function addMapLegend() {
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
      <h4>Bus Status</h4>
      <i style="background: #27ae60"></i> On Time<br>
      <i style="background: #e74c3c"></i> Delayed
    `;
    return div;
  };
  legend.addTo(map);
}

// Init
initMap();
addMapLegend();
fetchRoutes();
setInterval(fetchBuses, 5000); // Refresh every 5s











// let map;
// let markers = [];
// let currentRouteId = 'all';

// // Bus icons
// const busIcons = {
//   onTime: L.icon({
//     iconUrl: 'https://cdn-icons-png.flaticon.com/512/18042/18042856.png',
//     iconSize: [30, 30],
//     iconAnchor: [15, 30],
//     popupAnchor: [0, -30]
//   }),
//   delayed: L.icon({
//     iconUrl: 'https://cdn-icons-png.flaticon.com/512/18357/18357012.png',
//     iconSize: [30, 30],
//     iconAnchor: [15, 30],
//     popupAnchor: [0, -30]
//   })
// };

// // Define routes with coordinates
// const routesCoordinates = {
//   101: [
//     [6.9319, 79.8478], // Colombo
//     [7.2955, 80.6356]  // Kandy
//   ],
//   102: [
//     [6.9319, 79.8478], // Colombo
//     [6.0367, 80.217]   // Galle
//   ],
//   103: [
//     [6.9319, 79.8478], // Colombo
//     [5.9485, 80.5353]  // Matara
//   ],
//   104: [
//     [6.9319, 79.8478], // Colombo
//     [9.6685, 80.0074]  // Jaffna
//   ],
//   105: [
//     [8.3122, 80.4131], // Anuradhapura
//     [6.9319, 79.8478]  // Colombo
//   ]
// };

// // Keep track of bus positions along route (0 to 1)
// const busPositions = {};

// // Fetch routes for dropdown
// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   const select = document.getElementById('routeSelect');

//   // Add "All Routes" option
//   const allOption = document.createElement('option');
//   allOption.value = 'all';
//   allOption.textContent = 'All Routes';
//   select.appendChild(allOption);

//   routes.forEach(route => {
//     const option = document.createElement('option');
//     option.value = route.route_id;
//     option.textContent = route.name;
//     select.appendChild(option);
//   });

//   select.addEventListener('change', () => {
//     currentRouteId = select.value;
//     fetchBuses();
//   });

//   select.selectedIndex = 0;
//   fetchBuses();
// }

// // Fetch buses
// async function fetchBuses() {
//   try {
//     const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
//     const buses = await res.json();
//     updateMapAndList(buses);
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// // Move bus along route line
// function moveAlongRoute(routeId, pos) {
//   const coords = routesCoordinates[routeId];
//   if (!coords) return coords[0]; // fallback

//   const lat = coords[0][0] + (coords[1][0] - coords[0][0]) * pos;
//   const lng = coords[0][1] + (coords[1][1] - coords[0][1]) * pos;
//   return [lat, lng];
// }

// // Update map markers and table
// function updateMapAndList(routeBuses) {
//   // Clear previous markers
//   markers.forEach(m => map.removeLayer(m));
//   markers = [];

//   const tableBody = document.getElementById('busList');
//   tableBody.innerHTML = '';

//   routeBuses.forEach(bus => {
//     // Initialize bus position along route if not set
//     if (!busPositions[bus.bus_id]) busPositions[bus.bus_id] = Math.random() * 0.1;

//     // Move bus slightly along the route
//     busPositions[bus.bus_id] += Math.random() * 0.01;
//     if (busPositions[bus.bus_id] > 1) busPositions[bus.bus_id] = 0; // loop

//     const [lat, lng] = moveAlongRoute(bus.route_id, busPositions[bus.bus_id]);

//     const busIcon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;

//     // Map marker
//     const marker = L.marker([lat, lng], { icon: busIcon })
//       .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`);
//     marker.addTo(map);
//     markers.push(marker);

//     // Table row
//     const row = document.createElement('tr');
//     row.innerHTML = `
//       <td>${bus.bus_id}</td>
//       <td>${bus.route_id}</td>
//       <td class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</td>
//       <td>${lat.toFixed(5)}</td>
//       <td>${lng.toFixed(5)}</td>
//       <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
//     `;
//     tableBody.appendChild(row);
//   });
// }

// // Draw polylines for all routes
// function drawPolylines() {
//   for (const routeId in routesCoordinates) {
//     L.polyline(routesCoordinates[routeId], { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
//   }
// }

// // Initialize map
// function initMap() {
//   map = L.map('map').setView([7.8731, 80.7718], 7); // Center Sri Lanka
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);

//   drawPolylines(); // Draw the routes
// }

// // Legend
// function addMapLegend() {
//   const legend = L.control({ position: 'bottomright' });

//   legend.onAdd = function(map) {
//     const div = L.DomUtil.create('div', 'legend');
//     div.innerHTML = `
//       <h4>Bus Status</h4>
//       <i style="background: #27ae60"></i> On Time<br>
//       <i style="background: #e74c3c"></i> Delayed
//     `;
//     return div;
//   };

//   legend.addTo(map);
// }

// // Init
// initMap();
// addMapLegend();
// fetchRoutes();
// setInterval(fetchBuses, 5000);












// let map;
// let markers = [];
// let currentRouteId = 'all';

// // Bus icons
// const busIcons = {
//   onTime: L.icon({
//     iconUrl: 'https://cdn-icons-png.flaticon.com/512/18042/18042856.png',
//     iconSize: [30, 30],
//     iconAnchor: [15, 30],
//     popupAnchor: [0, -30]
//   }),
//   delayed: L.icon({
//     iconUrl: 'https://cdn-icons-png.flaticon.com/512/18357/18357012.png',
//     iconSize: [30, 30],
//     iconAnchor: [15, 30],
//     popupAnchor: [0, -30]
//   })
// };

// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   const select = document.getElementById('routeSelect');

//   // Add "All Routes" option
//   const allOption = document.createElement('option');
//   allOption.value = 'all';
//   allOption.textContent = 'All Routes';
//   select.appendChild(allOption);

//   routes.forEach(route => {
//     const option = document.createElement('option');
//     option.value = route.route_id;
//     option.textContent = route.name;
//     select.appendChild(option);
//   });

//   select.addEventListener('change', () => {
//     currentRouteId = select.value;
//     fetchBuses();
//   });

//   select.selectedIndex = 0;
//   fetchBuses();
// }

// async function fetchBuses() {
//   try {
//     const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
//     const buses = await res.json();
//     updateMapAndList(buses);
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// // Function to check if the coordinates are valid
// function isValidCoordinates(lat, lng) {
//   return lat >= 5.9 && lat <= 9.9 && lng >= 79.8 && lng <= 82.5;
// }

// function updateMapAndList(routeBuses) {
//   // Clear previous markers
//   markers.forEach(m => map.removeLayer(m));
//   markers = [];

//   // Update table
//   const tableBody = document.getElementById('busList');
//   tableBody.innerHTML = '';

//   routeBuses.forEach(bus => {
//     // Check if bus coordinates are valid
//     if (!isValidCoordinates(bus.current_location.latitude, bus.current_location.longitude)) {
//       console.warn(`Skipping bus ${bus.bus_id} due to invalid coordinates`);
//       return; // Skip invalid buses
//     }

//     // Determine the appropriate icon
//     const busIcon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;

//     // Map marker
//     const marker = L.marker([bus.current_location.latitude, bus.current_location.longitude], { icon: busIcon })
//       .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
//       .addTo(map);
//     markers.push(marker);

//     // Table row
//     const row = document.createElement('tr');
//     row.innerHTML = `
//       <td>${bus.bus_id}</td>
//       <td>${bus.route_id}</td>
//       <td class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</td>
//       <td>${bus.current_location.latitude.toFixed(5)}</td>
//       <td>${bus.current_location.longitude.toFixed(5)}</td>
//       <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
//     `;
//     tableBody.appendChild(row);
//   });
// }

// // Define routes with coordinates
// const routesCoordinates = {
//   101: [
//     [6.9319, 79.8478], // Colombo
//     [7.2955, 80.6356]  // Kandy
//   ],
//   102: [
//     [6.9319, 79.8478], // Colombo
//     [6.0367, 80.217]   // Galle
//   ],
//   103: [
//     [6.9319, 79.8478], // Colombo
//     [5.9485, 80.5353]  // Matara
//   ],
//   104: [
//     [6.9319, 79.8478], // Colombo
//     [9.6685, 80.0074]  // Jaffna
//   ],
//   105: [
//     [8.3122, 80.4131], // Anuradhapura
//     [6.9319, 79.8478]  // Colombo
//   ]
// };

// // Draw polylines for all routes
// function drawPolylines() {
//   for (const routeId in routesCoordinates) {
//     L.polyline(routesCoordinates[routeId], { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
//   }
// }


// function initMap() {
//   map = L.map('map').setView([7.8731, 80.7718], 7); // Center Sri Lanka
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);

//   drawPolylines(); // Draw the routes
// }

// function addMapLegend() {
//   const legend = L.control({ position: 'bottomright' });

//   legend.onAdd = function(map) {
//     const div = L.DomUtil.create('div', 'legend');
//     div.innerHTML = `
//       <h4>Bus Status</h4>
//       <i style="background: #27ae60"></i> On Time<br>
//       <i style="background: #e74c3c"></i> Delayed
//     `;
//     return div;
//   };

//   legend.addTo(map);
// }


// initMap();
// addMapLegend();
// fetchRoutes();
// setInterval(fetchBuses, 5000); // Update buses every 5 seconds












// let map;
// let markers = [];
// let currentRouteId = 'all';

// // Bus icons
// const busIcons = {
//   onTime: L.icon({
//     iconUrl: 'https://cdn-user-icons.flaticon.com/93776/93776300/1759411105998.svg?token=exp=1759412006~hmac=a7bec415b17937db6cc1648e02bafc80',
//     iconSize: [30, 30],
//     iconAnchor: [15, 30],
//     popupAnchor: [0, -30]
//   }),
//   delayed: L.icon({
//     iconUrl: 'https://cdn-user-icons.flaticon.com/93776/93776300/1759410956535.svg?token=exp=1759411947~hmac=88f319f96f53752ff11b2de3d5a78788',
//     iconSize: [30, 30],
//     iconAnchor: [15, 30],
//     popupAnchor: [0, -30]
//   })
// };

// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   const select = document.getElementById('routeSelect');

//   // Add "All Routes" option
//   const allOption = document.createElement('option');
//   allOption.value = 'all';
//   allOption.textContent = 'All Routes';
//   select.appendChild(allOption);

//   routes.forEach(route => {
//     const option = document.createElement('option');
//     option.value = route.route_id;
//     option.textContent = route.name;
//     select.appendChild(option);
//   });

//   select.addEventListener('change', () => {
//     currentRouteId = select.value;
//     fetchBuses();
//   });

//   select.selectedIndex = 0;
//   fetchBuses();
// }

// async function fetchBuses() {
//   try {
//     const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
//     const buses = await res.json();
//     updateMapAndList(buses);
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// function updateMapAndList(routeBuses) {
//   // Clear previous markers
//   markers.forEach(m => map.removeLayer(m));
//   markers = [];

//   // Update table
//   const tableBody = document.getElementById('busList');
//   tableBody.innerHTML = '';

//   routeBuses.forEach(bus => {
//     // Determine the appropriate icon
//     const busIcon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;

//     // Map marker
//     const marker = L.marker([bus.current_location.latitude, bus.current_location.longitude], { icon: busIcon })
//       .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
//       .addTo(map);
//     markers.push(marker);

//     // Table row
//     const row = document.createElement('tr');
//     row.innerHTML = `
//       <td>${bus.bus_id}</td>
//       <td>${bus.route_id}</td>
//       <td class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</td>
//       <td>${bus.current_location.latitude.toFixed(5)}</td>
//       <td>${bus.current_location.longitude.toFixed(5)}</td>
//       <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
//     `;
//     tableBody.appendChild(row);
//   });
// }

// function initMap() {
//   // map = L.map('map').setView([7.8731, 80.7718], 8);
//   map = L.map('map').setView([6.9271, 79.8612], 10);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);
// }

// function addMapLegend() {
//   const legend = L.control({ position: 'bottomright' });

//   legend.onAdd = function(map) {
//     const div = L.DomUtil.create('div', 'legend');
//     div.innerHTML = `
//       <h4>Bus Status</h4>
//       <i style="background: #27ae60"></i> On Time<br>
//       <i style="background: #e74c3c"></i> Delayed
//     `;
//     return div;
//   };

//   legend.addTo(map);
// }


// initMap();
// addMapLegend();
// fetchRoutes();
// setInterval(fetchBuses, 5000);
