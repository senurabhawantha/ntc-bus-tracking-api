// Mapbox access token (replace with your Mapbox API key)
mapboxgl.accessToken = 'YOUR_MAPBOX_API_KEY'; 

let map;
let markers = [];
let currentRouteId = 'all';

// Bus icons for On Time and Delayed buses
const busIcons = {
  onTime: L.icon({
    iconUrl: 'https://cdn-user-icons.flaticon.com/93776/93776300/1759411105998.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  delayed: L.icon({
    iconUrl: 'https://cdn-user-icons.flaticon.com/93776/93776300/1759410956535.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  })
};

// Route coordinates for each route
const routesCoordinates = {
  101: [
    [6.9319, 79.8478], // Colombo
    [7.2955, 80.6356]  // Kandy
  ],
  102: [
    [6.9319, 79.8478], // Colombo
    [6.0367, 80.217]   // Galle
  ],
  103: [
    [6.9319, 79.8478], // Colombo
    [5.9485, 80.5353]  // Matara
  ],
  104: [
    [6.9319, 79.8478], // Colombo
    [9.6685, 80.0074]  // Jaffna
  ],
  105: [
    [8.3122, 80.4131], // Anuradhapura
    [6.9319, 79.8478]  // Colombo
  ]
};

// Fetch routes from the API
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

// Fetch buses based on route selected
async function fetchBuses() {
  try {
    const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
    const buses = await res.json();
    updateMapAndList(buses);
  } catch (err) {
    console.error('Error fetching buses:', err);
  }
}

// Update map and table with bus locations and status
function updateMapAndList(routeBuses) {
  // Clear previous markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  // Update bus list table
  const tableBody = document.getElementById('busList');
  tableBody.innerHTML = '';

  routeBuses.forEach(bus => {
    // Determine bus icon (On Time or Delayed)
    const busIcon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;

    // Add bus marker on the map
    const marker = L.marker([bus.current_location.latitude, bus.current_location.longitude], { icon: busIcon })
      .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
      .addTo(map);
    markers.push(marker);

    // Add row to table
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${bus.bus_id}</td>
      <td>${bus.route_id}</td>
      <td class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</td>
      <td>${bus.current_location.latitude.toFixed(5)}</td>
      <td>${bus.current_location.longitude.toFixed(5)}</td>
      <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Initialize the map
function initMap() {
  mapboxgl.accessToken = 'YOUR_MAPBOX_API_KEY';
  const mapboxMap = new mapboxgl.Map({
    container: 'map', 
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [79.8612, 6.9271], 
    zoom: 10
  });

  mapboxMap.addControl(new mapboxgl.NavigationControl());

  // Draw polyline (route) on the map
  for (const routeId in routesCoordinates) {
    L.polyline(routesCoordinates[routeId], { color: 'blue' }).addTo(map);
  }
}

// Function to draw polyline (route) on the map using coordinates
function drawRoute(routeCoordinates) {
  L.polyline(routeCoordinates, { color: 'blue', weight: 5 }).addTo(map);
}

// // Call functions to initialize the map and fetch routes
// initMap();
// fetchRoutes();
// setInterval(fetchBuses, 5000);  // Update every 5 seconds











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

// // Route coordinates for each route
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
//   // Initialize the map centered at the center of Sri Lanka
//   map = L.map('map').setView([7.8731, 80.7718], 8); // Centering the map in the middle of Sri Lanka
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);

//   // Add routes as polylines
//   for (const routeId in routesCoordinates) {
//     L.polyline(routesCoordinates[routeId], { color: 'blue' }).addTo(map);
//   }
// }

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

initMap();
addMapLegend();
fetchRoutes();
setInterval(fetchBuses, 5000);













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

// function initMap() {
//   map = L.map('map').setView([6.9271, 79.8612], 10); // Center map around Sri Lanka
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
