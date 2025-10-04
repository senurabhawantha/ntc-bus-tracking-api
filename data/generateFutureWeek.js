// data/generateFutureWeek.js
const fs = require('fs');
const path = require('path');

// ---- Use the same route IDs and polylines you use on the frontend ----
const routes = [
  { route_id: 101, name: 'Colombo to Kandy' },
  { route_id: 102, name: 'Colombo to Galle' },
  { route_id: 103, name: 'Colombo to Jaffna' },
  { route_id: 104, name: 'Anuradhapura to Colombo' },
  { route_id: 105, name: 'Colombo to Matara' },
];

const routesCoordinates = {
  101: [ [6.9319,79.8478],[6.9660,79.9000],[7.0500,80.0000],[7.2000,80.2000],[7.2955,80.6356] ],
  102: [ [6.9319,79.8478],[6.8000,79.9500],[6.6000,80.1000],[6.0367,80.2170] ],
  103: [ [6.9319,79.8478],[7.5000,79.9000],[8.5000,80.0000],[9.6685,80.0074] ],
  104: [ [8.3122,80.4131],[7.9000,80.2000],[7.5000,80.0000],[6.9319,79.8478] ],
  105: [ [6.9319,79.8478],[6.7000,79.9000],[6.2000,80.3000],[5.9485,80.5353] ],
};

// helper to interpolate along a polyline 0..1
function lerpPolyline(coords, t) {
  const n = coords.length - 1;
  const i = Math.floor(Math.max(0, Math.min(0.999999, t)) * n);
  const f = (t * n) - i;
  const a = coords[i];
  const b = coords[i + 1];
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
  ];
}

// build waypoints for a day: 48 points (every 30 min) 06:00 → 06:00 next day
function buildWaypoints(route_id, startDateISO, dir = 1) {
  const coords = routesCoordinates[route_id];
  const out = [];
  const start = new Date(`${startDateISO}T06:00:00.000Z`).getTime();
  const steps = 48; // 24h / 30min

  for (let k = 0; k < steps; k++) {
    // t goes 0→1→0 if dir is -1 (simulate back & forth by day if you want)
    let t = k / (steps - 1);
    if (dir === -1) t = 1 - t;

    const [lat, lng] = lerpPolyline(coords, t);
    out.push({
      time: new Date(start + k * 30 * 60 * 1000).toISOString(),
      lat,
      lng,
    });
  }
  return out;
}

function isoDay(d) {
  // YYYY-MM-DD in UTC
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth()+1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// buses: use your existing convention: 5 routes × 5 buses = 25 (adjust if you want 50)
const BUSES_PER_ROUTE = 5;
const DAYS = 7;

const buses = [];
for (const route of routes) {
  for (let i = 1; i <= BUSES_PER_ROUTE; i++) {
    const bus_id = route.route_id * 100 + i;
    const plan = [];

    for (let d = 0; d < DAYS; d++) {
      const day = new Date();
      day.setUTCHours(0,0,0,0);
      day.setUTCDate(day.getUTCDate() + d);
      const dateISO = isoDay(day);

      // Alternate direction per bus/day for variety
      const dir = (i + d) % 2 === 0 ? 1 : -1;

      plan.push({
        date: dateISO,
        waypoints: buildWaypoints(route.route_id, dateISO, dir),
        statusForecast: Math.random() < 0.8 ? 'On Time' : 'Delayed',
      });
    }

    buses.push({
      bus_id,
      route_id: route.route_id,
      plan, // 7 days
    });
  }
}

const out = { routes, buses };
const outPath = path.join(__dirname, 'busFutureWeek.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`✅ Wrote future week to ${outPath}`);
