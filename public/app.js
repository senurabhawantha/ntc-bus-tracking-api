const routeSelect = document.getElementById("route-select");
const busList = document.getElementById("bus-list");
const mapContainer = document.getElementById("map");

let map;
let markers = {}; // Store markers to update their positions

// Initialize the Leaflet map
function initMap() {
  map = L.map('map').setView([6.9271, 79.8612], 12); // Centered around Colombo, zoom level 12

  // Add OpenStreetMap tiles to the map
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

// Fetch routes to populate dropdown
async function fetchRoutes() {
  try {
    const res = await fetch('/routes');
    const routes = await res.json();
    routes.forEach(route => {
      const option = document.createElement('option');
      option.value = route.route_id;
      option.textContent = route.route_name;
      routeSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Error fetching routes:', err);
  }
}

// Fetch buses based on selected route
async function fetchBuses() {
  try {
    const route_id = routeSelect.value;
    const res = await fetch('/buses' + (route_id ? `?route_id=${route_id}` : ''));
    const buses = await res.json();

    busList.innerHTML = '';
    buses.forEach(bus => {
      const row = document.createElement('tr');
      const statusClass = bus.status === 'On Time' ? 'status-on-time' : 'status-delayed';
      row.innerHTML = `
        <td>${bus.bus_id}</td>
        <td>${bus.route_id}</td>
        <td class="${statusClass}">${bus.status}</td>
        <td>${bus.current_location.latitude.toFixed(5)}</td>
        <td>${bus.current_location.longitude.toFixed(5)}</td>
        <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
      `;
      busList.appendChild(row);

      // Create or update marker for each bus on the map
      if (!markers[bus.bus_id]) {
        markers[bus.bus_id] = L.marker([bus.current_location.latitude, bus.current_location.longitude])
          .addTo(map)
          .bindPopup(`Bus ${bus.bus_id} - ${bus.status}`);
      } else {
        markers[bus.bus_id].setLatLng([bus.current_location.latitude, bus.current_location.longitude]);
      }
    });
  } catch (err) {
    console.error('Error fetching buses:', err);
  }
}

// Initial fetch
fetchRoutes();
fetchBuses();

// Polling: locations every 5s
setInterval(fetchBuses, 5000);

// Re-fetch when route changes
routeSelect.addEventListener('change', fetchBuses);

// Initialize the map
initMap();












// const routeSelect = document.getElementById("route-select");
// const busList = document.getElementById("bus-list");
// const mapContainer = document.getElementById("map");

// let map;
// let markers = {}; // Store markers to update their positions

// // Initialize the Leaflet map
// function initMap() {
//   map = L.map('map').setView([6.9271, 79.8612], 12); // Centered around Colombo, zoom level 12

//   // Add OpenStreetMap tiles to the map
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//   }).addTo(map);
// }

// // Fetch routes to populate dropdown
// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   routes.forEach(route => {
//     const option = document.createElement('option');
//     option.value = route.route_id;
//     option.textContent = route.route_name;
//     routeSelect.appendChild(option);
//   });
// }

// // Fetch buses based on selected route
// async function fetchBuses() {
//   try {
//     const route_id = routeSelect.value;
//     const res = await fetch('/buses' + (route_id ? `?route_id=${route_id}` : ''));
//     const buses = await res.json();

//     busList.innerHTML = '';
//     buses.forEach(bus => {
//       const row = document.createElement('tr');
//       const statusClass = bus.status === 'On Time' ? 'status-on-time' : 'status-delayed';
//       row.innerHTML = `
//         <td>${bus.bus_id}</td>
//         <td>${bus.route_id}</td>
//         <td class="${statusClass}">${bus.status}</td>
//         <td>${bus.current_location.latitude.toFixed(5)}</td>
//         <td>${bus.current_location.longitude.toFixed(5)}</td>
//         <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
//       `;
//       busList.appendChild(row);

//       // Create or update marker for each bus on the map
//       if (!markers[bus.bus_id]) {
//         // Create new marker if it doesn't exist
//         markers[bus.bus_id] = L.marker([bus.current_location.latitude, bus.current_location.longitude])
//           .addTo(map)
//           .bindPopup(`Bus ${bus.bus_id} - ${bus.status}`);
//       } else {
//         // Update the existing marker with new location
//         markers[bus.bus_id].setLatLng([bus.current_location.latitude, bus.current_location.longitude]);
//       }
//     });
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// // Initial fetch
// fetchRoutes();
// fetchBuses();

// // Polling: locations every 5s
// setInterval(fetchBuses, 5000);

// // Re-fetch when route changes
// routeSelect.addEventListener('change', fetchBuses);

// // Initialize the map
// initMap();






















// const routeSelect = document.getElementById("route-select");
// const busList = document.getElementById("bus-list");

// // Fetch routes to populate dropdown
// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   routes.forEach(route => {
//     const option = document.createElement('option');
//     option.value = route.route_id;
//     option.textContent = route.route_name;
//     routeSelect.appendChild(option);
//   });
// }

// // Fetch buses based on selected route
// async function fetchBuses() {
//   try {
//     const route_id = routeSelect.value;
//     const res = await fetch('/buses' + (route_id ? `?route_id=${route_id}` : ''));
//     const buses = await res.json();

//     busList.innerHTML = '';
//     buses.forEach(bus => {
//       const row = document.createElement('tr');
//       const statusClass = bus.status === 'On Time' ? 'status-on-time' : 'status-delayed';
//       row.innerHTML = `
//         <td>${bus.bus_id}</td>
//         <td>${bus.route_id}</td>
//         <td class="${statusClass}">${bus.status}</td>
//         <td>${bus.current_location.latitude.toFixed(5)}</td>
//         <td>${bus.current_location.longitude.toFixed(5)}</td>
//         <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
//       `;
//       busList.appendChild(row);
//     });
//   } catch (err) {
//     console.error(err);
//   }
// }

// // Initial fetch
// fetchRoutes();
// fetchBuses();

// // Polling: locations every 5s
// setInterval(fetchBuses, 5000);

// // Re-fetch when route changes
// routeSelect.addEventListener('change', fetchBuses);



























// const routeSelect = document.getElementById("route-select");
// const busList = document.getElementById("bus-list");

// // Fetch routes to populate dropdown
// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   routes.forEach(route => {
//     const option = document.createElement('option');
//     option.value = route.route_id;
//     option.textContent = route.route_name;
//     routeSelect.appendChild(option);
//   });
// }

// // Fetch buses and display
// async function fetchBuses() {
//   try {
//     const route_id = routeSelect.value;
//     const res = await fetch('/buses' + (route_id ? `?route_id=${route_id}` : ''));
//     const buses = await res.json();

//     busList.innerHTML = '';
//     buses.forEach(bus => {
//       const row = document.createElement('tr');
//       const statusClass = bus.status === 'On Time' ? 'status-on-time' : 'status-delayed';
//       row.innerHTML = `
//         <td>${bus.bus_id}</td>
//         <td>${bus.route_id}</td>
//         <td class="${statusClass}">${bus.status}</td>
//         <td>${bus.current_location.latitude.toFixed(5)}</td>
//         <td>${bus.current_location.longitude.toFixed(5)}</td>
//         <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
//       `;
//       busList.appendChild(row);
//     });
//   } catch (err) {
//     console.error(err);
//   }
// }

// // Initial fetch
// fetchRoutes();
// fetchBuses();

// // Polling: locations every 5s
// setInterval(fetchBuses, 5000);

// // Re-fetch when route changes
// routeSelect.addEventListener('change', fetchBuses);






















// async function fetchBusLocations() {
//   try {
//     const response = await fetch('/buses');
//     const buses = await response.json();

//     const busList = document.getElementById('bus-list');
//     busList.innerHTML = '';

//     buses.forEach(bus => {
//       const row = document.createElement('tr');

//       // Status with color
//       const statusClass = bus.status === 'On Time' ? 'status-on-time' : 'status-delayed';

//       row.innerHTML = `
//         <td>${bus.bus_id}</td>
//         <td>${bus.route_id}</td>
//         <td class="${statusClass}">${bus.status}</td>
//         <td>${bus.current_location.latitude.toFixed(5)}</td>
//         <td>${bus.current_location.longitude.toFixed(5)}</td>
//         <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
//       `;

//       busList.appendChild(row);
//     });
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// // Initial fetch
// fetchBusLocations();

// // Update every 5 seconds
// setInterval(fetchBusLocations, 5000);
