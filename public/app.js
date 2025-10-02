let map;
let markers = [];
let currentRouteId = 'all';

// Bus icons
const busIcons = {
  onTime: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4565/4565023.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  delayed: L.icon({
    iconUrl: 'https://img.freepik.com/premium-vector/bus-schedule-arrival-time-icon_116137-4525.jpg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  })
};

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

async function fetchBuses() {
  try {
    const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
    const buses = await res.json();
    updateMapAndList(buses);
  } catch (err) {
    console.error('Error fetching buses:', err);
  }
}

function updateMapAndList(routeBuses) {
  // Clear previous markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  // Update table
  const tableBody = document.getElementById('busList');
  tableBody.innerHTML = '';

  routeBuses.forEach(bus => {
    // Determine the appropriate icon
    const busIcon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;

    // Map marker
    const marker = L.marker([bus.current_location.latitude, bus.current_location.longitude], { icon: busIcon })
      .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
      .addTo(map);
    markers.push(marker);

    // Table row
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

function initMap() {
  map = L.map('map').setView([6.9271, 79.8612], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

initMap();
fetchRoutes();
setInterval(fetchBuses, 5000);
