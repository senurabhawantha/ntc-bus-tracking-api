let map;
let markers = [];
let currentRouteId;

async function fetchRoutes() {
  const res = await fetch('/routes');
  const routes = await res.json();
  const select = document.getElementById('routeSelect');

  routes.forEach(route => {
    const option = document.createElement('option');
    option.value = route.route_id;
    option.textContent = route.name;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    currentRouteId = parseInt(select.value);
    fetchBuses();
  });

  // Default select first route
  select.selectedIndex = 0;
  currentRouteId = routes[0].route_id;
  fetchBuses();
}

async function fetchBuses() {
  try {
    const res = await fetch(`/buses?route_id=${currentRouteId}`);
    const buses = await res.json();
    updateMapAndList(buses);
  } catch (err) {
    console.error('Error fetching buses:', err);
  }
}

function updateMapAndList(routeBuses) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const busList = document.getElementById('busList');
  busList.innerHTML = '';

  routeBuses.forEach(bus => {
    const marker = L.marker([bus.current_location.latitude, bus.current_location.longitude])
      .bindPopup(`Bus ${bus.bus_id}: ${bus.status}`)
      .addTo(map);
    markers.push(marker);

    const li = document.createElement('li');
    li.textContent = `Bus ${bus.bus_id} - ${bus.status} (${new Date(bus.last_updated).toLocaleTimeString()})`;
    busList.appendChild(li);
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
setInterval(fetchBuses, 5000); // Update map every 5s
