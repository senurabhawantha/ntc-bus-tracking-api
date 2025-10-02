const routeSelect = document.getElementById("route-select");
const busList = document.getElementById("bus-list");

// Fetch routes to populate dropdown
async function fetchRoutes() {
  const res = await fetch('/routes');
  const routes = await res.json();
  routes.forEach(route => {
    const option = document.createElement('option');
    option.value = route.route_id;
    option.textContent = route.route_name;
    routeSelect.appendChild(option);
  });
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
    });
  } catch (err) {
    console.error(err);
  }
}

// Initial fetch
fetchRoutes();
fetchBuses();

// Polling: locations every 5s
setInterval(fetchBuses, 5000);

// Re-fetch when route changes
routeSelect.addEventListener('change', fetchBuses);



























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
