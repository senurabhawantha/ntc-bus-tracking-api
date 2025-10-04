// public/app.js
let map;
let currentRouteId = 'all';

// animation & geocode refresh handles (so we don't stack loops/intervals)
let rafId = null;
let locIntervalId = null;

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

// Realistic-ish polylines
const routesCoordinates = {
  101: [[6.9319, 79.8478],[6.966,79.900],[7.050,80.000],[7.200,80.200],[7.2955,80.6356]],
  102: [[6.9319,79.8478],[6.800,79.950],[6.600,80.100],[6.0367,80.217]],
  103: [[6.9319,79.8478],[6.700,79.900],[6.200,80.300],[5.9485,80.5353]],
  104: [[6.9319,79.8478],[7.500,79.900],[8.500,80.000],[9.6685,80.0074]],
  105: [[8.3122,80.4131],[7.900,80.200],[7.500,80.000],[6.9319,79.8478]]
};

// Track bus pos/dir/marker
const busData = {}; // { bus_id: { pos, dir, marker } }

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

// Interpolate along polyline
function getPositionAlongRoute(routeId, t) {
  const coords = routesCoordinates[routeId];
  if (!coords) return [6.9271, 79.8612];
  const totalSegments = coords.length - 1;
  const segmentIndex = Math.floor(t * totalSegments);
  const segmentT = (t * totalSegments) - segmentIndex;
  const start = coords[segmentIndex];
  const end = coords[segmentIndex + 1] || coords[coords.length - 1];
  const lat = start[0] + (end[0] - start[0]) * segmentT;
  const lng = start[1] + (end[1] - start[1]) * segmentT;
  return [lat, lng];
}

// ---- map setup ----
function initMap() {
  map = L.map('map').setView([7.8731, 80.7718], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  drawPolylines();
}

function drawPolylines() {
  for (const routeId in routesCoordinates) {
    L.polyline(routesCoordinates[routeId], { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
  }
}

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

// ---- data fetching ----
async function fetchRoutes() {
  const res = await fetch('/routes');
  const routes = await res.json();
  const select = document.getElementById('routeSelect');

  // wipe & add "All Routes"
  select.innerHTML = '';
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

  // avoid stacking multiple listeners
  select.onchange = () => {
    currentRouteId = select.value;
    fetchAndAnimateBuses();
  };

  select.selectedIndex = 0;
  fetchAndAnimateBuses();
}

async function fetchAndAnimateBuses() {
  try {
    const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
    const buses = await res.json();
    animateBuses(buses);
  } catch (err) {
    console.error('Error fetching buses:', err);
  }
}

// ---- main animation & table (with periodic batch geocode) ----
async function animateBuses(routeBuses) {
  // cancel any previous loops/intervals to avoid stacking
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (locIntervalId) { clearInterval(locIntervalId); locIntervalId = null; }

  // Remove markers for buses that are no longer in selection
  const keepIds = new Set(routeBuses.map(b => b.bus_id));
  for (const id in busData) {
    if (!keepIds.has(Number(id)) && busData[id]?.marker) {
      map.removeLayer(busData[id].marker);
      delete busData[id];
    }
  }

  const tableBody = document.getElementById('busList');
  tableBody.innerHTML = '';

  // Build table rows now (location will be filled by batch geocode)
  routeBuses.forEach(bus => {
    if (!busData[bus.bus_id]) {
      busData[bus.bus_id] = {
        pos: Math.random(),                      // random start along route
        dir: Math.random() < 0.5 ? 1 : -1,       // random initial direction
        marker: null
      };
    }

    const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);
    const icon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;

    if (!busData[bus.bus_id].marker) {
      busData[bus.bus_id].marker = L.marker([lat, lng], { icon })
        .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
        .addTo(map);
    } else {
      busData[bus.bus_id].marker.setLatLng([lat, lng]);
      busData[bus.bus_id].marker.setPopupContent(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`);
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${bus.bus_id}</td>
      <td>${bus.route_id}</td>
      <td class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</td>
      <td id="loc-${bus.bus_id}">Loading…</td>
      <td id="ts-${bus.bus_id}">${new Date(bus.last_updated).toLocaleTimeString()}</td>
    `;
    tableBody.appendChild(row);

    // Fallback: if “Loading…” hasn’t been replaced in 3.5s, show “Unknown”
    setTimeout(() => {
      const cell = document.getElementById(`loc-${bus.bus_id}`);
      if (cell && cell.textContent === 'Loading…') cell.textContent = 'Unknown';
    }, 3500);
  });

  // function to batch-geocode current marker positions & refresh table cells
  async function refreshLocationCells() {
    const coords = routeBuses.map(b => {
      const [lat, lng] = getPositionAlongRoute(b.route_id, busData[b.bus_id].pos);
      return { bus_id: b.bus_id, key: `${round3(lat)},${round3(lng)}`, lat, lng };
    });

    // timeout wrapper for fetch (abort after 5s)
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch('/geocode/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coords: coords.map(c => ({ lat: c.lat, lng: c.lng })) }),
        signal: controller.signal
      });
      clearTimeout(t);

      const { results } = await res.json();
      coords.forEach(c => {
        const cell = document.getElementById(`loc-${c.bus_id}`);
        if (cell) cell.textContent = results[c.key] || 'Unknown';
      });
    } catch {
      clearTimeout(t);
      coords.forEach(c => {
        const cell = document.getElementById(`loc-${c.bus_id}`);
        if (cell && (cell.textContent === 'Loading…')) cell.textContent = 'Unknown';
      });
    }
  }

  // first fill immediately, then every 12s (keeps API load sensible)
  refreshLocationCells();
  locIntervalId = setInterval(refreshLocationCells, 12000);

  // animation loop — speed adjustable
  const step = () => {
    routeBuses.forEach(bus => {
      const speed = 0.0004 + Math.random() * 0.0005; // tweak to taste
      busData[bus.bus_id].pos += speed * busData[bus.bus_id].dir;

      // bounce at ends
      if (busData[bus.bus_id].pos > 1) {
        busData[bus.bus_id].pos = 1;
        busData[bus.bus_id].dir = -1;
      } else if (busData[bus.bus_id].pos < 0) {
        busData[bus.bus_id].pos = 0;
        busData[bus.bus_id].dir = 1;
      }

      const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);
      busData[bus.bus_id].marker.setLatLng([lat, lng]);
    });

    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);
}

// ---- boot ----
initMap();
addMapLegend();
fetchRoutes();

// refresh bus data every 30s: rebuild table, pick up new statuses/last_updated,
// and restart animation cleanly.
setInterval(fetchAndAnimateBuses, 30000);









// let map;
// let currentRouteId = 'all';

// // animation & geocode refresh handles (so we don't stack loops/intervals)
// let rafId = null;
// let locIntervalId = null;

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

// // Realistic-ish polylines
// const routesCoordinates = {
//   101: [[6.9319, 79.8478],[6.966,79.900],[7.050,80.000],[7.200,80.200],[7.2955,80.6356]],
//   102: [[6.9319,79.8478],[6.800,79.950],[6.600,80.100],[6.0367,80.217]],
//   103: [[6.9319,79.8478],[6.700,79.900],[6.200,80.300],[5.9485,80.5353]],
//   104: [[6.9319,79.8478],[7.500,79.900],[8.500,80.000],[9.6685,80.0074]],
//   105: [[8.3122,80.4131],[7.900,80.200],[7.500,80.000],[6.9319,79.8478]]
// };

// // Track bus pos/dir/marker
// const busData = {}; // { bus_id: { pos, dir, marker } }

// // ---- helpers ----
// function round3(n) {
//   return Math.round(n * 1000) / 1000;
// }

// // Interpolate along polyline
// function getPositionAlongRoute(routeId, t) {
//   const coords = routesCoordinates[routeId];
//   if (!coords) return [6.9271, 79.8612];
//   const totalSegments = coords.length - 1;
//   const segmentIndex = Math.floor(t * totalSegments);
//   const segmentT = (t * totalSegments) - segmentIndex;
//   const start = coords[segmentIndex];
//   const end = coords[segmentIndex + 1] || coords[coords.length - 1];
//   const lat = start[0] + (end[0] - start[0]) * segmentT;
//   const lng = start[1] + (end[1] - start[1]) * segmentT;
//   return [lat, lng];
// }

// // ---- map setup ----
// function initMap() {
//   map = L.map('map').setView([7.8731, 80.7718], 7);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);
//   drawPolylines();
// }

// function drawPolylines() {
//   for (const routeId in routesCoordinates) {
//     L.polyline(routesCoordinates[routeId], { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
//   }
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

// // ---- data fetching ----
// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   const select = document.getElementById('routeSelect');

//   // wipe & add "All Routes"
//   select.innerHTML = '';
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

//   select.onchange = () => {
//     currentRouteId = select.value;
//     fetchAndAnimateBuses();
//   };

//   select.selectedIndex = 0;
//   fetchAndAnimateBuses();
// }

// async function fetchAndAnimateBuses() {
//   try {
//     const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
//     const buses = await res.json();
//     animateBuses(buses);
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// // ---- main animation & table (with periodic batch geocode) ----
// async function animateBuses(routeBuses) {
//   // cancel any previous loops/intervals to avoid stacking
//   if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
//   if (locIntervalId) { clearInterval(locIntervalId); locIntervalId = null; }

//   const tableBody = document.getElementById('busList');
//   tableBody.innerHTML = '';

//   // Build table rows now (location will be filled by batch geocode)
//   routeBuses.forEach(bus => {
//     if (!busData[bus.bus_id]) {
//       busData[bus.bus_id] = {
//         pos: Math.random(),                      // random start along route
//         dir: Math.random() < 0.5 ? 1 : -1,       // random initial direction
//         marker: null
//       };
//     }

//     const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);
//     const icon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;

//     if (!busData[bus.bus_id].marker) {
//       busData[bus.bus_id].marker = L.marker([lat, lng], { icon })
//         .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
//         .addTo(map);
//     } else {
//       busData[bus.bus_id].marker.setLatLng([lat, lng]);
//       busData[bus.bus_id].marker.setPopupContent(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`);
//     }

//     const row = document.createElement('tr');
//     row.innerHTML = `
//       <td>${bus.bus_id}</td>
//       <td>${bus.route_id}</td>
//       <td class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</td>
//       <td id="loc-${bus.bus_id}">Loading…</td>
//       <td id="ts-${bus.bus_id}">${new Date(bus.last_updated).toLocaleTimeString()}</td>
//     `;
//     tableBody.appendChild(row);
//   });

//   // function to batch-geocode current marker positions & refresh table cells
//   async function refreshLocationCells() {
//     // collect current positions from animation state (not from DB)
//     const coords = routeBuses.map(b => {
//       const [lat, lng] = getPositionAlongRoute(b.route_id, busData[b.bus_id].pos);
//       return { bus_id: b.bus_id, key: `${round3(lat)},${round3(lng)}`, lat, lng };
//     });

//     try {
//       const res = await fetch('/geocode/batch', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ coords: coords.map(c => ({ lat: c.lat, lng: c.lng })) })
//       });
//       const { results } = await res.json();

//       coords.forEach(c => {
//         const cell = document.getElementById(`loc-${c.bus_id}`);
//         if (cell) cell.textContent = results[c.key] || 'Unknown';
//       });
//     } catch {
//       coords.forEach(c => {
//         const cell = document.getElementById(`loc-${c.bus_id}`);
//         if (cell) cell.textContent = 'Unknown';
//       });
//     }
//   }

//   // first fill immediately, then every 12s (keeps API load sensible)
//   refreshLocationCells();
//   locIntervalId = setInterval(refreshLocationCells, 12000);

//   // animation loop — increase speed a bit so motion is obvious
//   const step = () => {
//     routeBuses.forEach(bus => {
//       const speed = 0.0004 + Math.random() * 0.0005; // adjust to spread more
//       busData[bus.bus_id].pos += speed * busData[bus.bus_id].dir;

//       // bounce at ends
//       if (busData[bus.bus_id].pos > 1) {
//         busData[bus.bus_id].pos = 1;
//         busData[bus.bus_id].dir = -1;
//       } else if (busData[bus.bus_id].pos < 0) {
//         busData[bus.bus_id].pos = 0;
//         busData[bus.bus_id].dir = 1;
//       }

//       const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);
//       busData[bus.bus_id].marker.setLatLng([lat, lng]);
//     });

//     rafId = requestAnimationFrame(step);
//   };
//   rafId = requestAnimationFrame(step);
// }

// // ---- boot ----
// initMap();
// addMapLegend();
// fetchRoutes();

// // refresh bus data every 30s: this will rebuild the table rows,
// // pick up new statuses/last_updated from the server, and restart animation cleanly.
// setInterval(fetchAndAnimateBuses, 30000);








// // public/app.js
// let map;
// let currentRouteId = 'all';

// // animation handle so we don't stack loops
// let rafId = null;

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

// // Realistic-ish polylines
// const routesCoordinates = {
//   101: [[6.9319, 79.8478],[6.966,79.900],[7.050,80.000],[7.200,80.200],[7.2955,80.6356]],
//   102: [[6.9319,79.8478],[6.800,79.950],[6.600,80.100],[6.0367,80.217]],
//   103: [[6.9319,79.8478],[6.700,79.900],[6.200,80.300],[5.9485,80.5353]],
//   104: [[6.9319,79.8478],[7.500,79.900],[8.500,80.000],[9.6685,80.0074]],
//   105: [[8.3122,80.4131],[7.900,80.200],[7.500,80.000],[6.9319,79.8478]]
// };

// // Track bus pos/dir/marker
// const busData = {}; // { bus_id: { pos, dir, marker } }

// // ---- helpers ----
// function round3(n) {
//   return Math.round(n * 1000) / 1000;
// }

// // Interpolate along polyline
// function getPositionAlongRoute(routeId, t) {
//   const coords = routesCoordinates[routeId];
//   if (!coords) return [6.9271, 79.8612];
//   const totalSegments = coords.length - 1;
//   const segmentIndex = Math.floor(t * totalSegments);
//   const segmentT = (t * totalSegments) - segmentIndex;
//   const start = coords[segmentIndex];
//   const end = coords[segmentIndex + 1] || coords[coords.length - 1];
//   const lat = start[0] + (end[0] - start[0]) * segmentT;
//   const lng = start[1] + (end[1] - start[1]) * segmentT;
//   return [lat, lng];
// }

// // ---- map setup ----
// function initMap() {
//   map = L.map('map').setView([7.8731, 80.7718], 7);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);
//   drawPolylines();
// }

// function drawPolylines() {
//   for (const routeId in routesCoordinates) {
//     L.polyline(routesCoordinates[routeId], { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
//   }
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

// // ---- data fetching ----
// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   const select = document.getElementById('routeSelect');

//   // wipe & add "All Routes"
//   select.innerHTML = '';
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
//     fetchAndAnimateBuses();
//   });

//   select.selectedIndex = 0;
//   fetchAndAnimateBuses();
// }

// async function fetchAndAnimateBuses() {
//   try {
//     const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
//     const buses = await res.json();
//     animateBuses(buses);
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// // ---- main animation & table (with batch geocode) ----
// async function animateBuses(routeBuses) {
//   // cancel any previous loop to avoid stacking
//   if (rafId) {
//     cancelAnimationFrame(rafId);
//     rafId = null;
//   }

//   const tableBody = document.getElementById('busList');
//   tableBody.innerHTML = '';

//   // Prepare rows + gather coords for batch geocode
//   const coordsToGeocode = []; // {bus_id, key, lat, lng}
//   const rowIds = {}; // bus_id -> cellId

//   routeBuses.forEach(bus => {
//     if (!busData[bus.bus_id]) {
//       busData[bus.bus_id] = {
//         pos: Math.random(),
//         dir: Math.random() < 0.5 ? 1 : -1,
//         marker: null
//       };
//     }

//     const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);

//     // marker
//     const icon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;
//     if (!busData[bus.bus_id].marker) {
//       busData[bus.bus_id].marker = L.marker([lat, lng], { icon })
//         .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
//         .addTo(map);
//     } else {
//       busData[bus.bus_id].marker.setLatLng([lat, lng]);
//       busData[bus.bus_id].marker.setPopupContent(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`);
//     }

//     const cellId = `loc-${bus.bus_id}`;
//     rowIds[bus.bus_id] = cellId;

//     const row = document.createElement('tr');
//     row.innerHTML = `
//       <td>${bus.bus_id}</td>
//       <td>${bus.route_id}</td>
//       <td class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</td>
//       <td id="${cellId}">Loading…</td>
//       <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
//     `;
//     tableBody.appendChild(row);

//     coordsToGeocode.push({
//       bus_id: bus.bus_id,
//       key: `${round3(lat)},${round3(lng)}`,
//       lat,
//       lng
//     });
//   });

//   // Batch reverse-geocode
//   try {
//     const res = await fetch('/geocode/batch', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         coords: coordsToGeocode.map(c => ({ lat: c.lat, lng: c.lng }))
//       })
//     });
//     const { results } = await res.json();
//     coordsToGeocode.forEach(c => {
//       const cell = document.getElementById(rowIds[c.bus_id]);
//       if (cell) {
//         cell.textContent = results[c.key] || 'Unknown';
//       }
//     });
//   } catch (e) {
//     // graceful fallback
//     coordsToGeocode.forEach(c => {
//       const cell = document.getElementById(rowIds[c.bus_id]);
//       if (cell) cell.textContent = 'Unknown';
//     });
//   }

//   // Start animation loop
//   const step = () => {
//     routeBuses.forEach(bus => {
//       // tweak speed here if you want buses to spread more
//       const speed = 0.00015 + Math.random() * 0.00025;
//       busData[bus.bus_id].pos += speed * busData[bus.bus_id].dir;

//       if (busData[bus.bus_id].pos > 1) {
//         busData[bus.bus_id].pos = 1;
//         busData[bus.bus_id].dir = -1;
//       } else if (busData[bus.bus_id].pos < 0) {
//         busData[bus.bus_id].pos = 0;
//         busData[bus.bus_id].dir = 1;
//       }

//       const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);
//       busData[bus.bus_id].marker.setLatLng([lat, lng]);
//     });

//     rafId = requestAnimationFrame(step);
//   };
//   rafId = requestAnimationFrame(step);
// }

// // ---- boot ----
// initMap();
// addMapLegend();
// fetchRoutes();

// // refresh bus data every 30s (status/last_updated)
// setInterval(fetchAndAnimateBuses, 30000);









// let map;
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

// // Realistic polyline coordinates for routes
// const routesCoordinates = {
//   101: [[6.9319, 79.8478],[6.966,79.900],[7.050,80.000],[7.200,80.200],[7.2955,80.6356]],
//   102: [[6.9319,79.8478],[6.800,79.950],[6.600,80.100],[6.0367,80.217]],
//   103: [[6.9319,79.8478],[6.700,79.900],[6.200,80.300],[5.9485,80.5353]],
//   104: [[6.9319,79.8478],[7.500,79.900],[8.500,80.000],[9.6685,80.0074]],
//   105: [[8.3122,80.4131],[7.900,80.200],[7.500,80.000],[6.9319,79.8478]]
// };

// // Track bus positions, direction, and markers
// const busData = {}; // { bus_id: { pos: 0..1, dir: 1|-1, marker: L.marker } }

// // ------- Batch reverse geocoder (server) -------
// function roundCoord(n) { return Math.round(n * 1000) / 1000; }

// async function batchReverseGeocode(points) {
//   // points: Array<{lat, lng}>
//   const unique = {};
//   points.forEach(p => {
//     const key = `${roundCoord(p.lat)},${roundCoord(p.lng)}`;
//     unique[key] = { lat: p.lat, lng: p.lng };
//   });

//   const res = await fetch('/geocode/batch', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ coords: Object.values(unique) })
//   });

//   if (!res.ok) return {};
//   const data = await res.json();
//   return data.results || {};
// }
// // ----------------------------------------------

// // Initialize map
// function initMap() {
//   map = L.map('map').setView([7.8731, 80.7718], 7);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);
//   drawPolylines();
// }

// // Draw polylines for routes
// function drawPolylines() {
//   for (const routeId in routesCoordinates) {
//     L.polyline(routesCoordinates[routeId], { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
//   }
// }

// // Map legend
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

// // Fetch routes for dropdown
// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   const select = document.getElementById('routeSelect');

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
//     fetchAndAnimateBuses();
//   });

//   select.selectedIndex = 0;
//   fetchAndAnimateBuses();
// }

// // Get position along polyline
// function getPositionAlongRoute(routeId, t) {
//   const coords = routesCoordinates[routeId];
//   if (!coords) return [6.9271, 79.8612];
//   const totalSegments = coords.length - 1;
//   const segmentIndex = Math.floor(t * totalSegments);
//   const segmentT = (t * totalSegments) - segmentIndex;
//   const start = coords[segmentIndex];
//   const end = coords[segmentIndex + 1] || coords[coords.length - 1];
//   const lat = start[0] + (end[0] - start[0]) * segmentT;
//   const lng = start[1] + (end[1] - start[1]) * segmentT;
//   return [lat, lng];
// }

// // Animate buses
// function animateBuses(routeBuses) {
//   // Compute current positions first (no DOM yet)
//   const rowsData = routeBuses.map(bus => {
//     if (!busData[bus.bus_id]) {
//       busData[bus.bus_id] = {
//         pos: Math.random(), // random start position along the route
//         dir: Math.random() < 0.5 ? 1 : -1, // random initial direction
//         marker: null
//       };
//     }
//     const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);
//     return { bus, lat, lng };
//   });

//   // Batch geocode once for all rows
//   batchReverseGeocode(rowsData.map(r => ({ lat: r.lat, lng: r.lng })))
//     .then(geoMap => {
//       const tableBody = document.getElementById('busList');
//       tableBody.innerHTML = '';

//       rowsData.forEach(({ bus, lat, lng }) => {
//         const icon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;

//         if (!busData[bus.bus_id].marker) {
//           busData[bus.bus_id].marker = L.marker([lat, lng], { icon })
//             .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
//             .addTo(map);
//         } else {
//           busData[bus.bus_id].marker.setLatLng([lat, lng]);
//           busData[bus.bus_id].marker.setPopupContent(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`);
//         }

//         const key = `${roundCoord(lat)},${roundCoord(lng)}`;
//         const place = geoMap[key] || 'Unknown';

//         const row = document.createElement('tr');
//         row.innerHTML = `
//           <td>${bus.bus_id}</td>
//           <td>${bus.route_id}</td>
//           <td class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</td>
//           <td>${place}</td>
//           <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
//         `;
//         tableBody.appendChild(row);
//       });
//     })
//     .catch(() => {
//       // fallback if geocode fails
//       const tableBody = document.getElementById('busList');
//       tableBody.innerHTML = '';
//       rowsData.forEach(({ bus }) => {
//         const row = document.createElement('tr');
//         row.innerHTML = `
//           <td>${bus.bus_id}</td>
//           <td>${bus.route_id}</td>
//           <td class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</td>
//           <td>Unknown</td>
//           <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
//         `;
//         tableBody.appendChild(row);
//       });
//     });

//   // Smooth animation (marker movement only; table refreshes on next fetch)
//   function step() {
//     routeBuses.forEach(bus => {
//       // speed: tweak the 0.00025 to speed up/down movement
//       busData[bus.bus_id].pos += (0.00025 + Math.random() * 0.00025) * busData[bus.bus_id].dir;

//       // Reverse direction at ends of the route
//       if (busData[bus.bus_id].pos > 1) {
//         busData[bus.bus_id].pos = 1;
//         busData[bus.bus_id].dir = -1;
//       } else if (busData[bus.bus_id].pos < 0) {
//         busData[bus.bus_id].pos = 0;
//         busData[bus.bus_id].dir = 1;
//       }

//       const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);
//       if (busData[bus.bus_id].marker) {
//         busData[bus.bus_id].marker.setLatLng([lat, lng]);
//       }
//     });

//     requestAnimationFrame(step);
//   }
//   requestAnimationFrame(step);
// }

// // Fetch buses & animate
// async function fetchAndAnimateBuses() {
//   try {
//     const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
//     const buses = await res.json();
//     animateBuses(buses);
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// // Init
// initMap();
// addMapLegend();
// fetchRoutes();

// // Refresh status + table every 30s (animation keeps running)
// setInterval(fetchAndAnimateBuses, 30000);









// let map;
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

// // Realistic polyline coordinates for routes
// const routesCoordinates = {
//   101: [[6.9319, 79.8478],[6.966,79.900],[7.050,80.000],[7.200,80.200],[7.2955,80.6356]],
//   102: [[6.9319,79.8478],[6.800,79.950],[6.600,80.100],[6.0367,80.217]],
//   103: [[6.9319,79.8478],[6.700,79.900],[6.200,80.300],[5.9485,80.5353]],
//   104: [[6.9319,79.8478],[7.500,79.900],[8.500,80.000],[9.6685,80.0074]],
//   105: [[8.3122,80.4131],[7.900,80.200],[7.500,80.000],[6.9319,79.8478]]
// };

// // Track bus positions/directions/markers
// const busData = {}; // { bus_id: { pos: 0..1, dir: 1|-1, marker: L.marker } }

// // ---------- Reverse Geocoding (Nominatim) ----------
// const geocodeCache = new Map(); // key: "lat,lng" (rounded), value: place string
// const geocodeQueue = [];
// let geocoderBusy = false;
// const GEOCODE_DELAY_MS = 1100; // ~1 req/sec to be nice to the free API

// function roundCoord(n) {
//   return Math.round(n * 1000) / 1000; // 3-decimal rounding helps cache hits
// }

// function enqueueReverseGeocode(lat, lng, resolve) {
//   geocodeQueue.push({ lat, lng, resolve });
//   if (!geocoderBusy) processGeocodeQueue();
// }

// async function processGeocodeQueue() {
//   geocoderBusy = true;
//   while (geocodeQueue.length) {
//     const { lat, lng, resolve } = geocodeQueue.shift();
//     try {
//       const place = await doReverseGeocode(lat, lng);
//       resolve(place);
//     } catch (e) {
//       resolve('Unknown'); // fall back gracefully
//     }
//     await new Promise(r => setTimeout(r, GEOCODE_DELAY_MS));
//   }
//   geocoderBusy = false;
// }

// async function doReverseGeocode(lat, lng) {
//   const key = `${roundCoord(lat)},${roundCoord(lng)}`;
//   if (geocodeCache.has(key)) return geocodeCache.get(key);

//   const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
//   // Note: some browsers can’t set custom User-Agent; for heavy use, proxy through your server.
//   const res = await fetch(url, {
//     headers: { 'Accept': 'application/json' }
//   });
//   if (!res.ok) throw new Error('Geocode failed');

//   const data = await res.json();
//   const addr = data.address || {};
//   // Try to pick a sensible label: town/city/village + state/country as fallback.
//   const label =
//     addr.city ||
//     addr.town ||
//     addr.village ||
//     addr.municipality ||
//     addr.county ||
//     addr.state ||
//     addr.country ||
//     'Unknown';

//   geocodeCache.set(key, label);
//   return label;
// }

// function reverseGeocode(lat, lng) {
//   return new Promise((resolve) => {
//     enqueueReverseGeocode(lat, lng, resolve);
//   });
// }
// // ---------- /Reverse Geocoding ----------

// // Initialize map
// function initMap() {
//   map = L.map('map').setView([7.8731, 80.7718], 7);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);
//   drawPolylines();
// }

// // Draw polylines for routes
// function drawPolylines() {
//   for (const routeId in routesCoordinates) {
//     L.polyline(routesCoordinates[routeId], { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
//   }
// }

// // Map legend
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

// // Fetch routes for dropdown
// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   const select = document.getElementById('routeSelect');

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
//     fetchAndAnimateBuses();
//   });

//   select.selectedIndex = 0;
//   fetchAndAnimateBuses();
// }

// // Interpolate along a polyline
// function getPositionAlongRoute(routeId, t) {
//   const coords = routesCoordinates[routeId];
//   if (!coords) return [6.9271, 79.8612];
//   const totalSegments = coords.length - 1;
//   const segmentIndex = Math.floor(t * totalSegments);
//   const segmentT = (t * totalSegments) - segmentIndex;
//   const start = coords[segmentIndex];
//   const end = coords[segmentIndex + 1] || coords[coords.length - 1];
//   const lat = start[0] + (end[0] - start[0]) * segmentT;
//   const lng = start[1] + (end[1] - start[1]) * segmentT;
//   return [lat, lng];
// }

// // Animate buses (back & forth)
// function animateBuses(routeBuses) {
//   const tableBody = document.getElementById('busList');
//   tableBody.innerHTML = '';

//   routeBuses.forEach(bus => {
//     if (!busData[bus.bus_id]) {
//       busData[bus.bus_id] = {
//         pos: Math.random(),
//         dir: Math.random() < 0.5 ? 1 : -1,
//         marker: null
//       };
//     }

//     const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);

//     // Create or update marker
//     if (!busData[bus.bus_id].marker) {
//       busData[bus.bus_id].marker = L.marker([lat, lng], { icon: bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed })
//         .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
//         .addTo(map);
//     } else {
//       busData[bus.bus_id].marker.setLatLng([lat, lng]);
//       busData[bus.bus_id].marker.setPopupContent(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`);
//     }

//     // Build the row with a placeholder; we’ll fill location async
//     const row = document.createElement('tr');
//     const locationCellId = `loc-${bus.bus_id}`;
//     row.innerHTML = `
//       <td>${bus.bus_id}</td>
//       <td>${bus.route_id}</td>
//       <td class="${bus.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${bus.status}</td>
//       <td id="${locationCellId}">Loading…</td>
//       <td>${new Date(bus.last_updated).toLocaleTimeString()}</td>
//     `;
//     tableBody.appendChild(row);

//     // Reverse-geocode for a friendly location name (city/town/village…)
//     reverseGeocode(lat, lng).then(place => {
//       const cell = document.getElementById(locationCellId);
//       if (cell) cell.textContent = place;
//     });
//   });

//   // Animation loop
//   function step() {
//     routeBuses.forEach(bus => {
//       // adjust travel speed here if you want
//       const speed = 0.00015 + Math.random() * 0.00025;
//       busData[bus.bus_id].pos += speed * busData[bus.bus_id].dir;

//       // bounce at ends
//       if (busData[bus.bus_id].pos > 1) {
//         busData[bus.bus_id].pos = 1;
//         busData[bus.bus_id].dir = -1;
//       } else if (busData[bus.bus_id].pos < 0) {
//         busData[bus.bus_id].pos = 0;
//         busData[bus.bus_id].dir = 1;
//       }

//       const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);
//       busData[bus.bus_id].marker.setLatLng([lat, lng]);
//     });

//     requestAnimationFrame(step);
//   }
//   requestAnimationFrame(step);
// }

// // Fetch buses & animate
// async function fetchAndAnimateBuses() {
//   try {
//     const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
//     const buses = await res.json();
//     animateBuses(buses);
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// // Init
// initMap();
// addMapLegend();
// fetchRoutes();
// // Refresh bus data (status/last_updated) every 30s
// setInterval(fetchAndAnimateBuses, 30000);









// let map;
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

// // Realistic polyline coordinates for routes
// const routesCoordinates = {
//   101: [[6.9319, 79.8478],[6.966,79.900],[7.050,80.000],[7.200,80.200],[7.2955,80.6356]],
//   102: [[6.9319,79.8478],[6.800,79.950],[6.600,80.100],[6.0367,80.217]],
//   103: [[6.9319,79.8478],[6.700,79.900],[6.200,80.300],[5.9485,80.5353]],
//   104: [[6.9319,79.8478],[7.500,79.900],[8.500,80.000],[9.6685,80.0074]],
//   105: [[8.3122,80.4131],[7.900,80.200],[7.500,80.000],[6.9319,79.8478]]
// };

// // Track bus positions, direction, and markers
// const busData = {}; // { bus_id: { pos: 0..1, dir: 1 or -1, marker: L.marker } }

// // Initialize map
// function initMap() {
//   map = L.map('map').setView([7.8731, 80.7718], 7);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);

//   drawPolylines();
// }

// // Draw polylines for routes
// function drawPolylines() {
//   for (const routeId in routesCoordinates) {
//     L.polyline(routesCoordinates[routeId], { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
//   }
// }

// // Map legend
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

// // Fetch routes for dropdown
// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   const select = document.getElementById('routeSelect');

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
//     fetchAndAnimateBuses();
//   });

//   select.selectedIndex = 0;
//   fetchAndAnimateBuses();
// }

// // Get position along polyline
// function getPositionAlongRoute(routeId, t) {
//   const coords = routesCoordinates[routeId];
//   if (!coords) return [6.9271, 79.8612];
//   const totalSegments = coords.length - 1;
//   const segmentIndex = Math.floor(t * totalSegments);
//   const segmentT = (t * totalSegments) - segmentIndex;
//   const start = coords[segmentIndex];
//   const end = coords[segmentIndex + 1] || coords[coords.length - 1];
//   const lat = start[0] + (end[0] - start[0]) * segmentT;
//   const lng = start[1] + (end[1] - start[1]) * segmentT;
//   return [lat, lng];
// }

// // Animate buses
// function animateBuses(routeBuses) {
//   const tableBody = document.getElementById('busList');
//   tableBody.innerHTML = '';

//   routeBuses.forEach(bus => {
//     if (!busData[bus.bus_id]) {
//       busData[bus.bus_id] = {
//         pos: Math.random(), // random start along route
//         dir: Math.random() < 0.5 ? 1 : -1, // random initial direction
//         marker: null
//       };
//     }

//     const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);

//     // Create marker if it doesn't exist
//     if (!busData[bus.bus_id].marker) {
//       busData[bus.bus_id].marker = L.marker([lat, lng], { icon: bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed })
//         .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
//         .addTo(map);
//     } else {
//       busData[bus.bus_id].marker.setLatLng([lat, lng]);
//       busData[bus.bus_id].marker.setPopupContent(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`);
//     }

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

//   function step() {
//     routeBuses.forEach(bus => {
//       busData[bus.bus_id].pos += (0.0001 + Math.random() * 0.00015) * busData[bus.bus_id].dir;

//       // Reverse direction at ends
//       if (busData[bus.bus_id].pos > 1) {
//         busData[bus.bus_id].pos = 1;
//         busData[bus.bus_id].dir = -1;
//       }
//       if (busData[bus.bus_id].pos < 0) {
//         busData[bus.bus_id].pos = 0;
//         busData[bus.bus_id].dir = 1;
//       }

//       const [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);
//       busData[bus.bus_id].marker.setLatLng([lat, lng]);
//     });

//     requestAnimationFrame(step);
//   }

//   requestAnimationFrame(step);
// }

// // Fetch buses & animate
// async function fetchAndAnimateBuses() {
//   try {
//     const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
//     const buses = await res.json();
//     animateBuses(buses);
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// // Init
// initMap();
// addMapLegend();
// fetchRoutes();
// setInterval(fetchAndAnimateBuses, 30000); // Refresh bus data every 30s











// let map;
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

// // Example realistic polyline coordinates for routes
// const routesCoordinates = {
//   101: [[6.9319, 79.8478],[6.966,79.900],[7.050,80.000],[7.200,80.200],[7.2955,80.6356]],
//   102: [[6.9319,79.8478],[6.800,79.950],[6.600,80.100],[6.0367,80.217]],
//   103: [[6.9319,79.8478],[6.700,79.900],[6.200,80.300],[5.9485,80.5353]],
//   104: [[6.9319,79.8478],[7.500,79.900],[8.500,80.000],[9.6685,80.0074]],
//   105: [[8.3122,80.4131],[7.900,80.200],[7.500,80.000],[6.9319,79.8478]]
// };

// // Track bus positions and markers
// const busPositions = {}; // {bus_id: 0..1}
// const activeBusMarkers = {}; // {bus_id: L.marker}

// // Initialize map
// function initMap() {
//   map = L.map('map').setView([7.8731, 80.7718], 7);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);

//   drawPolylines();
// }

// // Draw polylines
// function drawPolylines() {
//   for (const routeId in routesCoordinates) {
//     L.polyline(routesCoordinates[routeId], { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
//   }
// }

// // Map legend
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

// // Fetch routes for dropdown
// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   const select = document.getElementById('routeSelect');

//   // Add "All Routes"
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
//     fetchAndAnimateBuses();
//   });

//   select.selectedIndex = 0;
//   fetchAndAnimateBuses();
// }

// // Interpolate along polyline
// function getPositionAlongRoute(routeId, t) {
//   const coords = routesCoordinates[routeId];
//   if (!coords) return [6.9271, 79.8612];
//   const totalSegments = coords.length - 1;
//   const segmentIndex = Math.floor(t * totalSegments);
//   const segmentT = (t * totalSegments) - segmentIndex;
//   const start = coords[segmentIndex];
//   const end = coords[segmentIndex + 1] || coords[coords.length - 1];
//   const lat = start[0] + (end[0] - start[0]) * segmentT;
//   const lng = start[1] + (end[1] - start[1]) * segmentT;
//   return [lat, lng];
// }

// // Animate buses along their polylines
// function animateBuses(routeBuses) {
//   const tableBody = document.getElementById('busList');
//   tableBody.innerHTML = '';

//   routeBuses.forEach(bus => {
//     if (!busPositions[bus.bus_id]) busPositions[bus.bus_id] = Math.random() * 0.05;

//     if (!activeBusMarkers[bus.bus_id]) {
//       const [lat, lng] = getPositionAlongRoute(bus.route_id, busPositions[bus.bus_id]);
//       const marker = L.marker([lat, lng], { icon: bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed })
//         .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
//         .addTo(map);
//       activeBusMarkers[bus.bus_id] = marker;
//     }

//     const [lat, lng] = getPositionAlongRoute(bus.route_id, busPositions[bus.bus_id]);
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

//   function step() {
//     routeBuses.forEach(bus => {
//       busPositions[bus.bus_id] += 0.001 + Math.random() * 0.0015;
//       if (busPositions[bus.bus_id] > 1) busPositions[bus.bus_id] = 0;
//       const [lat, lng] = getPositionAlongRoute(bus.route_id, busPositions[bus.bus_id]);
//       activeBusMarkers[bus.bus_id].setLatLng([lat, lng]);
//     });
//     requestAnimationFrame(step);
//   }
//   requestAnimationFrame(step);
// }

// // Fetch buses & animate
// async function fetchAndAnimateBuses() {
//   try {
//     const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
//     const buses = await res.json();
//     animateBuses(buses);
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// // Init
// initMap();
// addMapLegend();
// fetchRoutes();

// // Update bus data every 30s to refresh status
// setInterval(fetchAndAnimateBuses, 30000);






// let map;
// let markers = [];
// let currentRouteId = 'all';
// let filterStatus = 'all'; // "all" or "delayed"

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

// // Realistic polyline coordinates for routes (more intermediate points for smooth roads)
// const routesCoordinates = {
//   101: [ // Colombo → Kandy
//     [6.9319, 79.8478],
//     [6.966, 79.900],
//     [7.050, 80.000],
//     [7.200, 80.200],
//     [7.2955, 80.6356]
//   ],
//   102: [ // Colombo → Galle
//     [6.9319, 79.8478],
//     [6.800, 79.950],
//     [6.600, 80.100],
//     [6.0367, 80.217]
//   ],
//   103: [ // Colombo → Matara
//     [6.9319, 79.8478],
//     [6.700, 79.900],
//     [6.200, 80.300],
//     [5.9485, 80.5353]
//   ],
//   104: [ // Colombo → Jaffna
//     [6.9319, 79.8478],
//     [7.500, 79.900],
//     [8.500, 80.000],
//     [9.6685, 80.0074]
//   ],
//   105: [ // Anuradhapura → Colombo
//     [8.3122, 80.4131],
//     [7.900, 80.200],
//     [7.500, 80.000],
//     [6.9319, 79.8478]
//   ]
// };

// // Track bus positions along the polyline
// const busPositions = {}; // { bus_id: 0..1 }

// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();
//   const select = document.getElementById('routeSelect');

//   // Add "All Routes" option
//   select.innerHTML = ''; // reset
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
//     if (currentRouteId !== 'all') centerMapForRoute(currentRouteId);
//     fetchBuses();
//   });

//   select.selectedIndex = 0;
//   fetchBuses();
// }

// // Center map dynamically for a selected route
// function centerMapForRoute(routeId) {
//   const coords = routesCoordinates[routeId];
//   if (!coords) return;
//   const bounds = L.latLngBounds(coords);
//   map.fitBounds(bounds, { padding: [50, 50] });
// }

// // Interpolate bus position along polyline
// function getPositionAlongPolyline(routeId, t) {
//   const coords = routesCoordinates[routeId];
//   if (!coords) return coords ? coords[0] : [6.9271, 79.8612];

//   const totalSegments = coords.length - 1;
//   const segmentIndex = Math.floor(t * totalSegments);
//   const segmentT = (t * totalSegments) - segmentIndex;

//   const start = coords[segmentIndex];
//   const end = coords[segmentIndex + 1] || coords[coords.length - 1];

//   const lat = start[0] + (end[0] - start[0]) * segmentT;
//   const lng = start[1] + (end[1] - start[1]) * segmentT;
//   return [lat, lng];
// }

// async function fetchBuses() {
//   try {
//     const url = currentRouteId === 'all'
//       ? '/buses'
//       : `/buses?route_id=${currentRouteId}`;
//     const res = await fetch(url);
//     const buses = await res.json();
//     updateMapAndList(buses);
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// function updateMapAndList(routeBuses) {
//   markers.forEach(m => map.removeLayer(m));
//   markers = [];

//   const tableBody = document.getElementById('busList');
//   tableBody.innerHTML = '';

//   routeBuses.forEach(bus => {
//     if (filterStatus === 'delayed' && bus.status !== 'Delayed') return;

//     if (!busPositions[bus.bus_id]) busPositions[bus.bus_id] = Math.random() * 0.05;

//     busPositions[bus.bus_id] += 0.001 + Math.random() * 0.0015;
//     if (busPositions[bus.bus_id] > 1) busPositions[bus.bus_id] = 0;

//     const [lat, lng] = getPositionAlongPolyline(bus.route_id, busPositions[bus.bus_id]);
//     const busIcon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;

//     const marker = L.marker([lat, lng], { icon: busIcon })
//       .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`);
//     marker.addTo(map);
//     markers.push(marker);

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

// // Draw route polylines
// function drawPolylines() {
//   for (const routeId in routesCoordinates) {
//     L.polyline(routesCoordinates[routeId], { color: 'blue', weight: 5, opacity: 0.5 }).addTo(map);
//   }
// }

// // Initialize map
// function initMap() {
//   map = L.map('map').setView([7.8731, 80.7718], 7);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);

//   drawPolylines();
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

// // Initialize everything
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

// // Example realistic polyline coordinates for routes (add more intermediate points for smooth roads)
// const routesCoordinates = {
//   101: [ // Colombo → Kandy
//     [6.9319, 79.8478],
//     [6.966, 79.900],
//     [7.050, 80.000],
//     [7.200, 80.200],
//     [7.2955, 80.6356]
//   ],
//   102: [ // Colombo → Galle
//     [6.9319, 79.8478],
//     [6.800, 79.950],
//     [6.600, 80.100],
//     [6.0367, 80.217]
//   ],
//   103: [ // Colombo → Matara
//     [6.9319, 79.8478],
//     [6.700, 79.900],
//     [6.200, 80.300],
//     [5.9485, 80.5353]
//   ],
//   104: [ // Colombo → Jaffna
//     [6.9319, 79.8478],
//     [7.500, 79.900],
//     [8.500, 80.000],
//     [9.6685, 80.0074]
//   ],
//   105: [ // Anuradhapura → Colombo
//     [8.3122, 80.4131],
//     [7.900, 80.200],
//     [7.500, 80.000],
//     [6.9319, 79.8478]
//   ]
// };

// // Keep track of each bus position along the polyline
// const busPositions = {}; // { bus_id: indexAlongPolyline (0..1) }

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

// // Get bus position along polyline
// function getPositionAlongPolyline(routeId, t) {
//   const coords = routesCoordinates[routeId];
//   if (!coords) return coords ? coords[0] : [6.9271, 79.8612];

//   // Linear interpolation along multiple segments
//   const totalSegments = coords.length - 1;
//   const segmentIndex = Math.floor(t * totalSegments);
//   const segmentT = (t * totalSegments) - segmentIndex;

//   const start = coords[segmentIndex];
//   const end = coords[segmentIndex + 1] || coords[coords.length - 1];

//   const lat = start[0] + (end[0] - start[0]) * segmentT;
//   const lng = start[1] + (end[1] - start[1]) * segmentT;
//   return [lat, lng];
// }

// // Fetch buses and update map/table
// async function fetchBuses() {
//   try {
//     const res = await fetch(currentRouteId === 'all' ? '/buses' : `/buses?route_id=${currentRouteId}`);
//     const buses = await res.json();
//     updateMapAndList(buses);
//   } catch (err) {
//     console.error('Error fetching buses:', err);
//   }
// }

// // Update map markers and table
// function updateMapAndList(routeBuses) {
//   markers.forEach(m => map.removeLayer(m));
//   markers = [];

//   const tableBody = document.getElementById('busList');
//   tableBody.innerHTML = '';

//   routeBuses.forEach(bus => {
//     if (!busPositions[bus.bus_id]) busPositions[bus.bus_id] = Math.random() * 0.05; // start near beginning

//     busPositions[bus.bus_id] += 0.002 + Math.random() * 0.003; // move along polyline
//     if (busPositions[bus.bus_id] > 1) busPositions[bus.bus_id] = 0; // loop back

//     const [lat, lng] = getPositionAlongPolyline(bus.route_id, busPositions[bus.bus_id]);
//     const busIcon = bus.status === 'On Time' ? busIcons.onTime : busIcons.delayed;

//     const marker = L.marker([lat, lng], { icon: busIcon })
//       .bindPopup(`<strong>Bus ${bus.bus_id}</strong><br>Status: <span style="color: ${bus.status === 'On Time' ? 'green' : 'red'}">${bus.status}</span>`)
//       .addTo(map);
//     markers.push(marker);

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
//   map = L.map('map').setView([7.8731, 80.7718], 7);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);

//   drawPolylines();
// }

// // Map legend
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
// setInterval(fetchBuses, 5000); // Refresh every 5s











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
