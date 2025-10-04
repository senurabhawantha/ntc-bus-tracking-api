// public/app.js
let map;
let currentRouteId = 'all';
let currentDateStr = ''; // YYYY-MM-DD

// animation & geocode refresh handles
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

// Polylines aligned to your DB IDs (fixed)
const routesCoordinates = {
  101: [ // Colombo → Kandy
    [6.9319, 79.8478],
    [6.9660, 79.9000],
    [7.0500, 80.0000],
    [7.2000, 80.2000],
    [7.2955, 80.6356]
  ],
  102: [ // Colombo → Galle
    [6.9319, 79.8478],
    [6.8000, 79.9500],
    [6.6000, 80.1000],
    [6.0367, 80.2170]
  ],
  103: [ // Colombo → Jaffna
    [6.9319, 79.8478],
    [7.5000, 79.9000],
    [8.5000, 80.0000],
    [9.6685, 80.0074]
  ],
  104: [ // Anuradhapura → Colombo
    [8.3122, 80.4131],
    [7.9000, 80.2000],
    [7.5000, 80.0000],
    [6.9319, 79.8478]
  ],
  105: [ // Colombo → Matara
    [6.9319, 79.8478],
    [6.7000, 79.9000],
    [6.2000, 80.3000],
    [5.9485, 80.5353]
  ]
};

// Track bus pos/dir/marker
const busData = {}; // { bus_id: { pos, dir, marker } }

// ---- helpers ----
function round2(n) { return Math.round(n * 100) / 100; }
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
  legend.onAdd = function() {
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
  const dayInput = document.getElementById('daySelect');

  // init date to today (formatted YYYY-MM-DD)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  currentDateStr = `${yyyy}-${mm}-${dd}`;
  dayInput.value = currentDateStr;

  // limit picker to next 7 days
  const max = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000);
  const mm2 = String(max.getMonth() + 1).padStart(2, '0');
  const dd2 = String(max.getDate()).padStart(2, '0');
  dayInput.min = currentDateStr;
  dayInput.max = `${max.getFullYear()}-${mm2}-${dd2}`;

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

  select.onchange = () => {
    currentRouteId = select.value;
    fetchAndAnimateBuses();
  };

  dayInput.onchange = () => {
    currentDateStr = dayInput.value;
    fetchAndAnimateBuses();
  };

  select.selectedIndex = 0;
  fetchAndAnimateBuses();
}

async function fetchAndAnimateBuses() {
  try {
    const base = currentRouteId === 'all'
      ? `/buses?date=${encodeURIComponent(currentDateStr)}`
      : `/buses?route_id=${currentRouteId}&date=${encodeURIComponent(currentDateStr)}`;

    const res = await fetch(base);
    const buses = await res.json();
    animateBuses(buses);
  } catch (err) {
    console.error('Error fetching buses:', err);
  }
}

// ---- main animation & table (with periodic batch geocode) ----
async function animateBuses(routeBuses) {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (locIntervalId) { clearInterval(locIntervalId); locIntervalId = null; }

  const tableBody = document.getElementById('busList');
  tableBody.innerHTML = '';

  routeBuses.forEach(bus => {
    if (!busData[bus.bus_id]) {
      busData[bus.bus_id] = {
        pos: Math.random(),
        dir: Math.random() < 0.5 ? 1 : -1,
        marker: null
      };
    }

    // If API is giving us a current_location for the chosen day, anchor marker to that position at start
    let [lat, lng] = [bus.current_location?.latitude, bus.current_location?.longitude];
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      [lat, lng] = getPositionAlongRoute(bus.route_id, busData[bus.bus_id].pos);
    }

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
      <td id="ts-${bus.bus_id}">${new Date(bus.last_updated).toLocaleString()}</td>
    `;
    tableBody.appendChild(row);
  });

  async function refreshLocationCells() {
    const coords = routeBuses.map(b => {
      const m = busData[b.bus_id].marker.getLatLng();
      return { bus_id: b.bus_id, key: `${round2(m.lat)},${round2(m.lng)}`, lat: m.lat, lng: m.lng };
    });

    const setUnknownTimer = setTimeout(() => {
      coords.forEach(c => {
        const cell = document.getElementById(`loc-${c.bus_id}`);
        if (cell && cell.textContent === 'Loading…') cell.textContent = 'Unknown';
      });
    }, 6000);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('/geocode/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coords: coords.map(c => ({ lat: c.lat, lng: c.lng })) }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error('geocode HTTP error');

      const { results } = await res.json();
      coords.forEach(c => {
        const cell = document.getElementById(`loc-${c.bus_id}`);
        if (cell) cell.textContent = results[c.key] || 'Unknown';
      });
    } catch {
      coords.forEach(c => {
        const cell = document.getElementById(`loc-${c.bus_id}`);
        if (cell) cell.textContent = 'Unknown';
      });
    }
  }

  await refreshLocationCells();
  locIntervalId = setInterval(refreshLocationCells, 20000);

  // slower bus motion
  const step = () => {
    routeBuses.forEach(bus => {
      const speed = 0.00008 + Math.random() * 0.00012;
      busData[bus.bus_id].pos += speed * busData[bus.bus_id].dir;

      if (busData[bus.bus_id].pos > 1) { busData[bus.bus_id].pos = 1; busData[bus.bus_id].dir = -1; }
      else if (busData[bus.bus_id].pos < 0) { busData[bus.bus_id].pos = 0; busData[bus.bus_id].dir = 1; }

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

// refresh every 30s (status for that chosen date won’t change, but keeps UI consistent)
setInterval(fetchAndAnimateBuses, 30000);











// // public/app.js

// // public/app.js
// let map;
// let currentRouteId = 'all';

// // animation & geocode refresh handles
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

// // Realistic-ish polylines (IDs aligned with your /routes)
// // Realistic-ish polylines (aligned to your DB IDs)
// const routesCoordinates = {
//   101: [ // Colombo → Kandy
//     [6.9319, 79.8478],
//     [6.9660, 79.9000],
//     [7.0500, 80.0000],
//     [7.2000, 80.2000],
//     [7.2955, 80.6356]
//   ],
//   102: [ // Colombo → Galle
//     [6.9319, 79.8478],
//     [6.8000, 79.9500],
//     [6.6000, 80.1000],
//     [6.0367, 80.2170]
//   ],
//   103: [ // Colombo → Jaffna   (FIXED: was Matara)
//     [6.9319, 79.8478],
//     [7.5000, 79.9000],
//     [8.5000, 80.0000],
//     [9.6685, 80.0074]
//   ],
//   104: [ // Anuradhapura → Colombo   (FIXED: was Jaffna)
//     [8.3122, 80.4131],
//     [7.9000, 80.2000],
//     [7.5000, 80.0000],
//     [6.9319, 79.8478]
//   ],
//   105: [ // Colombo → Matara   (FIXED: was Anuradhapura)
//     [6.9319, 79.8478],
//     [6.7000, 79.9000],
//     [6.2000, 80.3000],
//     [5.9485, 80.5353]
//   ]
// };



// // const routesCoordinates = {
// //   101: [[6.9319, 79.8478],[6.966,79.900],[7.050,80.000],[7.200,80.200],[7.2955,80.6356]],
// //   102: [[6.9319,79.8478],[6.800,79.950],[6.600,80.100],[6.0367,80.217]],
// //   103: [[6.9319,79.8478],[6.700,79.900],[6.200,80.300],[5.9485,80.5353]],
// //   104: [[6.9319,79.8478],[7.500,79.900],[8.500,80.000],[9.6685,80.0074]],
// //   105: [[8.3122,80.4131],[7.900,80.200],[7.500,80.000],[6.9319,79.8478]]
// // };

// // Track bus pos/dir/marker
// const busData = {}; // { bus_id: { pos, dir, marker } }

// // ---- helpers ----
// function round2(n) {
//   return Math.round(n * 100) / 100; // 2 decimals → better city-level hits
// }
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
//   legend.onAdd = function() {
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
//       return { bus_id: b.bus_id, key: `${round2(lat)},${round2(lng)}`, lat, lng };
//     });

//     // Set a watchdog so "Loading…" doesn't stay forever
//     const stillLoadingToUnknownTimer = setTimeout(() => {
//       coords.forEach(c => {
//         const cell = document.getElementById(`loc-${c.bus_id}`);
//         if (cell && cell.textContent === 'Loading…') {
//           cell.textContent = 'Unknown';
//         }
//       });
//     }, 6000); // after 6s, no more 'Loading…'

//     try {
//       const controller = new AbortController();
//       const timeout = setTimeout(() => controller.abort(), 5000); // 5s client timeout

//       const res = await fetch('/geocode/batch', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ coords: coords.map(c => ({ lat: c.lat, lng: c.lng })) }),
//         signal: controller.signal
//       });
//       clearTimeout(timeout);

//       if (!res.ok) throw new Error('geocode HTTP error');

//       const { results } = await res.json();
//       coords.forEach(c => {
//         const cell = document.getElementById(`loc-${c.bus_id}`);
//         if (cell) {
//           cell.textContent = results[c.key] || 'Unknown';
//         }
//       });
//     } catch {
//       coords.forEach(c => {
//         const cell = document.getElementById(`loc-${c.bus_id}`);
//         if (cell) cell.textContent = 'Unknown';
//       });
//     }
//   }

//   // first fill immediately, then every 20s (less load ⇒ more success)
//   await refreshLocationCells();
//   locIntervalId = setInterval(refreshLocationCells, 20000);

//   // animation loop — SLOWER buses now
//   const step = () => {
//     routeBuses.forEach(bus => {
//       const speed = 0.00008 + Math.random() * 0.00012; // ↓ slower motion
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

// // refresh bus data every 30s
// setInterval(fetchAndAnimateBuses, 30000);

