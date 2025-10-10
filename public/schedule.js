// ----- UI refs -----
const routeSelect = document.getElementById('routeSelect');
const dateInput   = document.getElementById('dateInput');
const loadBtn     = document.getElementById('loadBtn');
const busList     = document.getElementById('busList');
const statusNote  = document.getElementById('statusNote');

// Route → Start/End city labels (aligned with your polylines)
const routeCityMap = {
  101: [{ start: 'Colombo', end: 'Kandy' }, { start: 'Kandy', end: 'Colombo' }],
  102: [{ start: 'Colombo', end: 'Galle' }, { start: 'Galle', end: 'Colombo' }],
  103: [{ start: 'Colombo', end: 'Jaffna' }, { start: 'Jaffna', end: 'Colombo' }],
  104: [{ start: 'Anuradhapura', end: 'Colombo' }, { start: 'Colombo', end: 'Anuradhapura' }],
  105: [{ start: 'Colombo', end: 'Matara' }, { start: 'Matara', end: 'Colombo' }]
};

// Base start time per route (local time). Change per route if you want.
function baseStartForRoute(routeId, selectedDate) {
  // 06:00 local for all routes by default
  const d = selectedDate ? new Date(selectedDate) : new Date();
  d.setHours(6, 0, 0, 0);
  return d;
}

// Format time only (e.g., "08:15 AM")
function formatTimeOnly(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toYMD(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

// Build a 45-min-gap schedule per route, based on bus order
function buildScheduledTimes(buses, selectedDate) {
  // Group by route_id
  const byRoute = new Map();
  buses.forEach(b => {
    const r = Number(b.route_id);
    if (!byRoute.has(r)) byRoute.set(r, []);
    byRoute.get(r).push(b);
  });

  // For each route, sort and assign times
  const scheduled = new Map(); // bus_id -> Date
  for (const [routeId, list] of byRoute.entries()) {
    // sort buses by bus_id within each route for stable schedule
    list.sort((a, b) => Number(a.bus_id) - Number(b.bus_id));
    const base = baseStartForRoute(routeId, selectedDate);
    list.forEach((bus, idx) => {
      const t = new Date(base.getTime() + idx * 45 * 60 * 1000); // 45 min steps
      scheduled.set(bus.bus_id, t);
    });
  }
  return scheduled;
}

async function loadBuses() {
  busList.innerHTML = '';
  statusNote.textContent = 'Loading…';
  loadBtn.disabled = true;

  const route = routeSelect.value;
  const selectedDate = dateInput.value; // used only to anchor the base time

  const url = new URL(location.origin + '/buses');
  if (route && route !== 'all') url.searchParams.set('route_id', route);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buses = await res.json();

    // Compute schedule (45 min gaps per route)
    const scheduleMap = buildScheduledTimes(buses, selectedDate);

    // ---- SORT for display ----
    const list = [...buses];
    if (route === 'all') {
      list.sort((a, b) =>
        Number(a.route_id) - Number(b.route_id) ||
        Number(a.bus_id)  - Number(b.bus_id)
      );
    } else {
      list.sort((a, b) => Number(a.bus_id) - Number(b.bus_id));
    }

    // Render rows in sorted order
    list.forEach(b => {
      const routeId = Number(b.route_id);
      const directions = routeCityMap[routeId] || [{ start: '—', end: '—' }];
      const startTime = scheduleMap.get(b.bus_id);
      const timeOnly = startTime ? formatTimeOnly(startTime) : '—';

      // Render both directions for each route in the timetable
      directions.forEach(direction => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${b.bus_id}</td>
          <td>${routeId}</td>
          <td>${timeOnly}</td>
          <td>${direction.start}</td>
          <td>${direction.end}</td>
        `;
        busList.appendChild(tr);
      });
    });

    statusNote.textContent =
      `Showing ${list.length} buses (${route === 'all' ? 'sorted by route' : 'for route ' + route}).`;
  } catch (e) {
    statusNote.textContent = 'Failed to load buses.';
    console.error(e);
  } finally {
    loadBtn.disabled = false;
  }
}

(async function boot() {
  await fetchRoutes();
  dateInput.value = toYMD(new Date()); // anchors the base time at 06:00 of this date
  await loadBuses();

  loadBtn.addEventListener('click', loadBuses);
})();














// // public/schedule.js

// // ----- UI refs -----
// const routeSelect = document.getElementById('routeSelect');
// const dateInput   = document.getElementById('dateInput');
// const loadBtn     = document.getElementById('loadBtn');
// const busList     = document.getElementById('busList');
// const statusNote  = document.getElementById('statusNote');

// // Route → Start/End city labels (aligned with your polylines)
// const routeCityMap = {
//   101: { start: 'Colombo', end: 'Kandy' },
//   102: { start: 'Colombo', end: 'Galle' },
//   103: { start: 'Colombo', end: 'Jaffna' },
//   104: { start: 'Anuradhapura', end: 'Colombo' },
//   105: { start: 'Colombo', end: 'Matara' },
//   // If you want the reverse direction (Kandy → Colombo) as a separate route, add:
//   // 106: { start: 'Kandy', end: 'Colombo' },
// };

// // Base start time per route (local time). Change per route if you want.
// function baseStartForRoute(routeId, selectedDate) {
//   // 06:00 local for all routes by default
//   const d = selectedDate ? new Date(selectedDate) : new Date();
//   d.setHours(6, 0, 0, 0);
//   return d;
// }

// // Format time only (e.g., "08:15 AM")
// function formatTimeOnly(d) {
//   return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// }

// function toYMD(d) {
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth()+1).padStart(2,'0');
//   const dd = String(d.getDate()).padStart(2,'0');
//   return `${yyyy}-${mm}-${dd}`;
// }

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

// // Build a 45-min-gap schedule per route, based on bus order
// function buildScheduledTimes(buses, selectedDate) {
//   // Group by route_id
//   const byRoute = new Map();
//   buses.forEach(b => {
//     const r = Number(b.route_id);
//     if (!byRoute.has(r)) byRoute.set(r, []);
//     byRoute.get(r).push(b);
//   });

//   // For each route, sort and assign times
//   const scheduled = new Map(); // bus_id -> Date
//   for (const [routeId, list] of byRoute.entries()) {
//     // sort buses by bus_id within each route for stable schedule
//     list.sort((a, b) => Number(a.bus_id) - Number(b.bus_id));
//     const base = baseStartForRoute(routeId, selectedDate);
//     list.forEach((bus, idx) => {
//       const t = new Date(base.getTime() + idx * 45 * 60 * 1000); // 45 min steps
//       scheduled.set(bus.bus_id, t);
//     });
//   }
//   return scheduled;
// }

// async function loadBuses() {
//   busList.innerHTML = '';
//   statusNote.textContent = 'Loading…';
//   loadBtn.disabled = true;

//   const route = routeSelect.value;
//   const selectedDate = dateInput.value; // used only to anchor the base time

//   const url = new URL(location.origin + '/buses');
//   if (route && route !== 'all') url.searchParams.set('route_id', route);

//   try {
//     const res = await fetch(url.toString());
//     if (!res.ok) throw new Error('HTTP ' + res.status);
//     const buses = await res.json();

//     // Compute schedule (45 min gaps per route)
//     const scheduleMap = buildScheduledTimes(buses, selectedDate);

//     // ---- SORT for display ----
//     const list = [...buses];
//     if (route === 'all') {
//       list.sort((a, b) =>
//         Number(a.route_id) - Number(b.route_id) ||
//         Number(a.bus_id)  - Number(b.bus_id)
//       );
//     } else {
//       list.sort((a, b) => Number(a.bus_id) - Number(b.bus_id));
//     }

//     // Render rows in sorted order
//     list.forEach(b => {
//       const routeId = Number(b.route_id);
//       const cities = routeCityMap[routeId] || { start: '—', end: '—' };
//       const startTime = scheduleMap.get(b.bus_id);
//       const timeOnly = startTime ? formatTimeOnly(startTime) : '—';

//       const tr = document.createElement('tr');
//       tr.innerHTML = `
//         <td>${b.bus_id}</td>
//         <td>${routeId}</td>
//         <td>${timeOnly}</td>
//         <td>${cities.start}</td>
//         <td>${cities.end}</td>
//       `;
//       busList.appendChild(tr);
//     });

//     statusNote.textContent =
//       `Showing ${list.length} buses (${route === 'all' ? 'sorted by route' : 'for route ' + route}).`;
//   } catch (e) {
//     statusNote.textContent = 'Failed to load buses.';
//     console.error(e);
//   } finally {
//     loadBtn.disabled = false;
//   }
// }

// (async function boot() {
//   await fetchRoutes();
//   dateInput.value = toYMD(new Date()); // anchors the base time at 06:00 of this date
//   await loadBuses();

//   loadBtn.addEventListener('click', loadBuses);
// })();


