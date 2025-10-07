// public/schedule.js
function toYMD(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}

const routeSelect = document.getElementById('routeSelect');
const dateInput   = document.getElementById('dateInput');
const loadBtn     = document.getElementById('loadBtn');
const busList     = document.getElementById('busList');
const statusNote  = document.getElementById('statusNote');

// Route → Start/End city labels (aligned with your polylines)
const routeCityMap = {
  101: { start: 'Colombo',        end: 'Kandy' },
  102: { start: 'Colombo',        end: 'Galle' },
  103: { start: 'Colombo',        end: 'Jaffna' },
  104: { start: 'Anuradhapura',   end: 'Colombo' },
  105: { start: 'Colombo',        end: 'Matara' },
};

// Format time only (no date)
function formatTimeOnly(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return '—';
  // e.g. "03:27 PM"
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function fetchRoutes() {
  const res = await fetch('/routes');
  const routes = await res.json();

  routeSelect.innerHTML = '';
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = 'All Routes';
  routeSelect.appendChild(all);

  routes.forEach(r => {
    const opt = document.createElement('option');
    opt.value = String(r.route_id);
    opt.textContent = `${r.route_id} — ${r.name}`;
    routeSelect.appendChild(opt);
  });
}

async function loadBuses() {
  busList.innerHTML = '';
  statusNote.textContent = 'Loading…';
  loadBtn.disabled = true;

  const route = routeSelect.value;
  const date  = dateInput.value; // FYI: backend doesn’t filter by this (yet)

  const url = new URL(location.origin + '/buses');
  if (route && route !== 'all') url.searchParams.set('route_id', route);
  // Do NOT send date since the API doesn’t support it; avoids confusion

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buses = await res.json();

    buses.forEach(b => {
      const routeId = Number(b.route_id);
      const cities = routeCityMap[routeId] || { start: '—', end: '—' };
      const timeOnly = formatTimeOnly(b.last_updated);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${b.bus_id}</td>
        <td>${routeId}</td>
        <td>${timeOnly}</td>
        <td>${cities.start}</td>
        <td>${cities.end}</td>
      `;
      busList.appendChild(tr);
    });

    statusNote.textContent =
      `Showing ${buses.length} buses for ${route === 'all' ? 'all routes' : 'route ' + route}.`;
  } catch (e) {
    statusNote.textContent = 'Failed to load buses.';
    console.error(e);
  } finally {
    loadBtn.disabled = false;
  }
}

(async function boot() {
  await fetchRoutes();
  dateInput.value = toYMD(new Date());
  await loadBuses();

  loadBtn.addEventListener('click', loadBuses);
  // keep UX explicit: click Load to refresh
})();










// // public/schedule.js
// function toYMD(d) {
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth()+1).padStart(2,'0');
//   const dd = String(d.getDate()).padStart(2,'0');
//   return `${yyyy}-${mm}-${dd}`;
// }

// const routeSelect = document.getElementById('routeSelect');
// const dateInput   = document.getElementById('dateInput');
// const loadBtn     = document.getElementById('loadBtn');
// const busList     = document.getElementById('busList');
// const statusNote  = document.getElementById('statusNote');

// // Route → Start/End city labels (aligned with your polylines)
// const routeCityMap = {
//   101: { start: 'Colombo',        end: 'Kandy' },
//   102: { start: 'Colombo',        end: 'Galle' },
//   103: { start: 'Colombo',        end: 'Jaffna' },
//   104: { start: 'Anuradhapura',   end: 'Colombo' },
//   105: { start: 'Colombo',        end: 'Matara' },
// };

// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();

//   routeSelect.innerHTML = '';
//   const all = document.createElement('option');
//   all.value = 'all';
//   all.textContent = 'All Routes';
//   routeSelect.appendChild(all);

//   routes.forEach(r => {
//     const opt = document.createElement('option');
//     opt.value = String(r.route_id);
//     opt.textContent = `${r.route_id} — ${r.name}`;
//     routeSelect.appendChild(opt);
//   });
// }

// async function loadBuses() {
//   busList.innerHTML = '';
//   statusNote.textContent = 'Loading…';
//   loadBtn.disabled = true;

//   const route = routeSelect.value;
//   const date  = dateInput.value; // YYYY-MM-DD

//   const url = new URL(location.origin + '/buses');
//   if (route && route !== 'all') url.searchParams.set('route_id', route);
//   if (date) url.searchParams.set('date', date);

//   try {
//     const res = await fetch(url.toString());
//     if (!res.ok) throw new Error('HTTP ' + res.status);
//     const buses = await res.json();

//     // Render simple rows: Bus ID | Route ID | Start Time | Start City | End City
//     buses.forEach(b => {
//       const routeId = Number(b.route_id);
//       const cities = routeCityMap[routeId] || { start: '—', end: '—' };
//       const startTime = b.last_updated ? new Date(b.last_updated).toLocaleString() : '—';

//       const tr = document.createElement('tr');
//       tr.innerHTML = `
//         <td>${b.bus_id}</td>
//         <td>${routeId}</td>
//         <td>${startTime}</td>
//         <td>${cities.start}</td>
//         <td>${cities.end}</td>
//       `;
//       busList.appendChild(tr);
//     });

//     statusNote.textContent =
//       `Showing ${buses.length} buses for ${route === 'all' ? 'all routes' : 'route ' + route} on ${date || 'today'}.`;
//   } catch (e) {
//     statusNote.textContent = 'Failed to load buses.';
//     console.error(e);
//   } finally {
//     loadBtn.disabled = false;
//   }
// }

// (async function boot() {
//   await fetchRoutes();
//   dateInput.value = toYMD(new Date());
//   await loadBuses();

//   loadBtn.addEventListener('click', loadBuses);
//   routeSelect.addEventListener('change', () => {/* manual Load keeps UX explicit */});
//   dateInput.addEventListener('keydown', (e) => {
//     if (e.key === 'Enter') loadBuses();
//   });
// })();









// // public/schedule.js
// function round2(n) { return Math.round(n * 100) / 100; }

// const routeSelect = document.getElementById('routeSelect');
// const dateInput   = document.getElementById('dateInput');
// const loadBtn     = document.getElementById('loadBtn');
// const busList     = document.getElementById('busList');
// const statusNote  = document.getElementById('statusNote');

// async function fetchRoutes() {
//   const res = await fetch('/routes');
//   const routes = await res.json();

//   routeSelect.innerHTML = '';
//   const all = document.createElement('option');
//   all.value = 'all';
//   all.textContent = 'All Routes';
//   routeSelect.appendChild(all);

//   routes.forEach(r => {
//     const opt = document.createElement('option');
//     opt.value = String(r.route_id);
//     opt.textContent = `${r.route_id} — ${r.name}`;
//     routeSelect.appendChild(opt);
//   });
// }

// function toYMD(d) {
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth()+1).padStart(2,'0');
//   const dd = String(d.getDate()).padStart(2,'0');
//   return `${yyyy}-${mm}-${dd}`;
// }

// async function loadBuses() {
//   busList.innerHTML = '';
//   statusNote.textContent = 'Loading…';
//   loadBtn.disabled = true;

//   const route = routeSelect.value;
//   const date  = dateInput.value; // YYYY-MM-DD

//   // build URL with optional route_id
//   const url = new URL(location.origin + '/buses');
//   if (route && route !== 'all') url.searchParams.set('route_id', route);
//   if (date) url.searchParams.set('date', date);

//   try {
//     const res = await fetch(url.toString());
//     if (!res.ok) throw new Error('HTTP ' + res.status);
//     const buses = await res.json();

//     // fill table quickly with Loading… for city, then batch geocode
//     const coords = [];
//     buses.forEach(b => {
//       const lat = b.current_location?.latitude;
//       const lng = b.current_location?.longitude;
//       const row = document.createElement('tr');
//       row.innerHTML = `
//         <td>${b.bus_id}</td>
//         <td>${b.route_id}</td>
//         <td class="${b.status === 'On Time' ? 'status-on-time' : 'status-delayed'}">${b.status}</td>
//         <td id="city-${b.bus_id}">${(lat && lng) ? 'Loading…' : '—'}</td>
//         <td>${lat != null ? lat.toFixed(5) : '—'}</td>
//         <td>${lng != null ? lng.toFixed(5) : '—'}</td>
//         <td>${b.last_updated ? new Date(b.last_updated).toLocaleString() : '—'}</td>
//       `;
//       busList.appendChild(row);

//       if (lat != null && lng != null) {
//         coords.push({ bus_id: b.bus_id, lat, lng, key:`${round2(lat)},${round2(lng)}` });
//         // watchdog so Loading… doesn’t hang forever
//         setTimeout(() => {
//           const cell = document.getElementById(`city-${b.bus_id}`);
//           if (cell && cell.textContent === 'Loading…') cell.textContent = 'Unknown';
//         }, 6000);
//       }
//     });

//     // batch geocode if we have any coordinates
//     if (coords.length) {
//       try {
//         const controller = new AbortController();
//         const t = setTimeout(() => controller.abort(), 5000);
//         const gres = await fetch('/geocode/batch', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ coords: coords.map(c => ({ lat: c.lat, lng: c.lng })) }),
//           signal: controller.signal
//         });
//         clearTimeout(t);

//         if (gres.ok) {
//           const { results } = await gres.json();
//           coords.forEach(c => {
//             const cell = document.getElementById(`city-${c.bus_id}`);
//             if (cell) cell.textContent = results[c.key] || 'Unknown';
//           });
//         } else {
//           coords.forEach(c => {
//             const cell = document.getElementById(`city-${c.bus_id}`);
//             if (cell) cell.textContent = 'Unknown';
//           });
//         }
//       } catch {
//         coords.forEach(c => {
//           const cell = document.getElementById(`city-${c.bus_id}`);
//           if (cell) cell.textContent = 'Unknown';
//         });
//       }
//     }

//     statusNote.textContent = `Showing ${buses.length} buses for ${route === 'all' ? 'all routes' : 'route ' + route} on ${date || 'today'}.`;
//   } catch (e) {
//     statusNote.textContent = 'Failed to load buses.';
//     console.error(e);
//   } finally {
//     loadBtn.disabled = false;
//   }
// }

// (async function boot() {
//   await fetchRoutes();
//   // default date = today
//   dateInput.value = toYMD(new Date());
//   // auto-load first view
//   await loadBuses();

//   loadBtn.addEventListener('click', loadBuses);
//   routeSelect.addEventListener('change', () => { /* optional: auto-load */ });
//   dateInput.addEventListener('keydown', (e) => {
//     if (e.key === 'Enter') loadBuses();
//   });
// })();
