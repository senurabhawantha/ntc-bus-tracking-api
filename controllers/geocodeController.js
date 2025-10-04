// controllers/geocodeController.js
const fs = require('fs');
const path = require('path');
const { LRUCache } = require('lru-cache');

// Load local Sri Lanka city list once.
// File: data/sriLankaCities.json
// Format: [{ "name":"Colombo", "lat":6.9271, "lng":79.8612 }, ...]
const citiesPath = path.join(__dirname, '..', 'data', 'sriLankaCities.json');
let cities = [];
try {
  cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
} catch (e) {
  console.error('ERROR: Could not read data/sriLankaCities.json. Make sure the file exists and is valid JSON.');
  cities = []; // we'll guard below
}

// LRU cache keyed by rounded lat,lng -> city name
const cache = new LRUCache({
  max: 5000,
  ttl: 1000 * 60 * 60 * 12, // 12 hours
});

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Round to ~1km grid for strong cache hits
function roundKey(lat, lng) {
  const rlat = Math.round(lat * 100) / 100;
  const rlng = Math.round(lng * 100) / 100;
  return `${rlat},${rlng}`;
}

// Pure local reverse geocode: ALWAYS return the nearest city name
function nearestCity(lat, lng) {
  if (!cities.length) return 'Sri Lanka'; // fallback if list is missing
  let bestName = cities[0].name;
  let bestD = Infinity;
  for (const c of cities) {
    const d = haversine(lat, lng, c.lat, c.lng);
    if (d < bestD) {
      bestD = d;
      bestName = c.name;
    }
  }
  return bestName;
}

// “Reverse one” using ONLY local dataset + cache
async function reverseOne(lat, lng) {
  const key = roundKey(lat, lng);
  const cached = cache.get(key);
  if (cached) return { key, place: cached };

  const place = nearestCity(lat, lng); // always returns a city string
  cache.set(key, place);
  return { key, place };
}

// GET /geocode?lat=..&lng=..
exports.geocode = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'Invalid lat/lng' });
    }
    const { place } = await reverseOne(lat, lng);
    res.json({ place });
  } catch (e) {
    res.status(500).json({ message: 'Geocode error' });
  }
};

// POST /geocode/batch  { coords: [{lat,lng}, ...] }
exports.batchGeocode = async (req, res) => {
  try {
    const coords = Array.isArray(req.body.coords) ? req.body.coords : [];
    const unique = new Map(); // dedupe by rounded key

    for (const c of coords.slice(0, 1000)) {
      const lat = Number(c.lat);
      const lng = Number(c.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const key = roundKey(lat, lng);
        if (!unique.has(key)) unique.set(key, { lat, lng });
      }
    }

    const results = {};
    for (const [key, { lat, lng }] of unique.entries()) {
      const { place } = await reverseOne(lat, lng);
      results[key] = place;
    }

    res.json({ results });
  } catch (e) {
    res.status(500).json({ message: 'Batch geocode error' });
  }
};










// // controllers/geocodeController.js
// const fs = require('fs');
// const path = require('path');
// const { LRUCache } = require('lru-cache');

// // In-memory cache (city names by rounded lat/lng)
// const cache = new LRUCache({
//   max: 2000,                 // up to 2000 distinct rounded coords
//   ttl: 1000 * 60 * 60 * 6,   // 6 hours
// });

// // Load a local Sri Lanka cities dataset for offline/fallback lookups.
// // File: data/sriLankaCities.json  ->  [{ "name":"Colombo", "lat":6.9271, "lng":79.8612 }, ...]
// const cities = JSON.parse(
//   fs.readFileSync(path.join(__dirname, '..', 'data', 'sriLankaCities.json'), 'utf-8')
// );

// // Haversine distance in kilometers
// function haversine(lat1, lon1, lat2, lon2) {
//   const toRad = d => (d * Math.PI) / 180;
//   const R = 6371;
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // Nearest city fallback (used when Nominatim fails/returns weak data)
// function nearestCity(lat, lng) {
//   let bestName = 'Unknown';
//   let bestD = Infinity;
//   for (const c of cities) {
//     const d = haversine(lat, lng, c.lat, c.lng);
//     if (d < bestD) {
//       bestD = d;
//       bestName = c.name;
//     }
//   }
//   return bestName;
// }

// // 2-decimal rounding ~1 km granularity => more cache hits & stable city labels
// function roundKey(lat, lng) {
//   const rlat = Math.round(lat * 100) / 100;
//   const rlng = Math.round(lng * 100) / 100;
//   return `${rlat},${rlng}`;
// }

// // Reverse geocode one point with cache + graceful fallback to nearest city
// async function reverseOne(lat, lng) {
//   const key = roundKey(lat, lng);
//   const cached = cache.get(key);
//   if (cached) return { key, place: cached };

//   const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;

//   let label = 'Unknown';
//   try {
//     // Node 18+ has global fetch
//     const res = await fetch(url, {
//       headers: {
//         'Accept': 'application/json',
//         // Good practice per Nominatim policy; set via .env if you can
//         'User-Agent': process.env.GEOCODER_USER_AGENT || 'NTC-Bus-Tracker/1.0 (student demo)',
//       },
//     });

//     if (res.ok) {
//       const data = await res.json();
//       const addr = data.address || {};
//       label =
//         addr.city ||
//         addr.town ||
//         addr.village ||
//         addr.suburb ||
//         addr.municipality ||
//         addr.state_district ||
//         addr.county ||
//         addr.state ||
//         addr.country ||
//         'Unknown';
//     }
//   } catch {
//     // network/timeout -> keep label as 'Unknown' to trigger fallback below
//   }

//   if (label === 'Unknown') {
//     label = nearestCity(lat, lng);
//   }

//   cache.set(key, label);
//   return { key, place: label };
// }

// // GET /geocode?lat=..&lng=..
// exports.geocode = async (req, res) => {
//   try {
//     const lat = Number(req.query.lat);
//     const lng = Number(req.query.lng);
//     if (Number.isNaN(lat) || Number.isNaN(lng)) {
//       return res.status(400).json({ message: 'Invalid lat/lng' });
//     }
//     const { place } = await reverseOne(lat, lng);
//     res.json({ place });
//   } catch {
//     res.status(500).json({ message: 'Geocode error' });
//   }
// };

// // POST /geocode/batch   { coords: [{lat,lng}, ...] }
// exports.batchGeocode = async (req, res) => {
//   try {
//     const coords = Array.isArray(req.body.coords) ? req.body.coords : [];
//     const unique = new Map(); // dedupe by rounded key for better cache usage

//     // Hard cap to avoid overload
//     for (const c of coords.slice(0, 1000)) {
//       const lat = Number(c.lat);
//       const lng = Number(c.lng);
//       if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
//         const key = roundKey(lat, lng);
//         if (!unique.has(key)) unique.set(key, { lat, lng });
//       }
//     }

//     const results = {};
//     for (const [key, { lat, lng }] of unique.entries()) {
//       const { place } = await reverseOne(lat, lng);
//       results[key] = place;
//       // polite pacing to Nominatim (also mostly served by our cache)
//       await new Promise(r => setTimeout(r, 200));
//     }

//     res.json({ results });
//   } catch {
//     res.status(500).json({ message: 'Batch geocode error' });
//   }
// };









// // controllers/geocodeController.js
// // controllers/geocodeController.js
// const fs = require('fs');
// const path = require('path');
// const { LRUCache } = require('lru-cache');

// const cache = new LRUCache({
//   max: 2000,
//   ttl: 1000 * 60 * 60 * 6, // 6 hours
// });

// // load local cities once
// const cities = JSON.parse(
//   fs.readFileSync(path.join(__dirname, '..', 'data', 'sriLankaCities.json'), 'utf-8')
// );

// // haversine distance in km
// function haversine(lat1, lon1, lat2, lon2) {
//   const toRad = d => (d * Math.PI) / 180;
//   const R = 6371;
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // nearest city fallback
// function nearestCity(lat, lng) {
//   let best = null;
//   let bestD = Infinity;
//   for (const c of cities) {
//     const d = haversine(lat, lng, c.lat, c.lng);
//     if (d < bestD) {
//       bestD = d;
//       best = c.name;
//     }
//   }
//   return best || 'Unknown';
// }

// function roundKey(lat, lng) {
//   // 2-decimals => stronger cache hit rate (≈1km granularity)
//   const rlat = Math.round(lat * 100) / 100;
//   const rlng = Math.round(lng * 100) / 100;
//   return `${rlat},${rlng}`;
// }

// async function reverseOne(lat, lng) {
//   const key = roundKey(lat, lng);
//   const cached = cache.get(key);
//   if (cached) return { key, place: cached };

//   const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;

//   try {
//     const res = await fetch(url, {
//       headers: {
//         Accept: 'application/json',
//         'User-Agent':
//           process.env.GEOCODER_USER_AGENT || 'NTC-Bus-Tracker/1.0 (student demo)',
//       },
//     });

//     let label = 'Unknown';
//     if (res.ok) {
//       const data = await res.json();
//       const addr = data.address || {};
//       label =
//         addr.city ||
//         addr.town ||
//         addr.village ||
//         addr.suburb ||
//         addr.municipality ||
//         addr.state_district ||
//         addr.county ||
//         addr.state ||
//         addr.country ||
//         'Unknown';
//     }

//     // fallback to nearest known city if still Unknown
//     if (label === 'Unknown') {
//       label = nearestCity(lat, lng);
//     }

//     cache.set(key, label);
//     return { key, place: label };
//   } catch {
//     const label = nearestCity(lat, lng);
//     cache.set(key, label);
//     return { key, place: label };
//   }
// }

// // GET /geocode?lat=..&lng=..
// exports.geocode = async (req, res) => {
//   try {
//     const lat = Number(req.query.lat);
//     const lng = Number(req.query.lng);
//     if (Number.isNaN(lat) || Number.isNaN(lng)) {
//       return res.status(400).json({ message: 'Invalid lat/lng' });
//     }
//     const { place } = await reverseOne(lat, lng);
//     res.json({ place });
//   } catch {
//     res.status(500).json({ message: 'Geocode error' });
//   }
// };

// // POST /geocode/batch { coords: [{lat,lng}, ...] }
// exports.batchGeocode = async (req, res) => {
//   try {
//     const coords = Array.isArray(req.body.coords) ? req.body.coords : [];
//     const unique = new Map();

//     for (const c of coords.slice(0, 1000)) {
//       const lat = Number(c.lat);
//       const lng = Number(c.lng);
//       if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
//         const key = roundKey(lat, lng);
//         if (!unique.has(key)) unique.set(key, { lat, lng });
//       }
//     }

//     const results = {};
//     for (const [key, { lat, lng }] of unique.entries()) {
//       const { place } = await reverseOne(lat, lng);
//       results[key] = place;
//       // be polite to Nominatim
//       await new Promise(r => setTimeout(r, 200));
//     }

//     res.json({ results });
//   } catch {
//     res.status(500).json({ message: 'Batch geocode error' });
//   }
// };













// const { LRUCache } = require('lru-cache');

// const cache = new LRUCache({
//   max: 2000,
//   ttl: 1000 * 60 * 60, // 1 hour
// });

// // helpers
// function round3(n) {
//   return Math.round(n * 1000) / 1000;
// }

// async function reverseOne(lat, lng) {
//   const key = `${round3(lat)},${round3(lng)}`;
//   const cached = cache.get(key);
//   if (cached) return { key, place: cached };

//   const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;

//   try {
//     const res = await fetch(url, {
//       headers: {
//         'Accept': 'application/json',
//         'User-Agent': process.env.GEOCODER_USER_AGENT || 'NTC-Bus-Tracker/1.0 (student demo)',
//       },
//     });

//     if (!res.ok) {
//       cache.set(key, 'Unknown');
//       return { key, place: 'Unknown' };
//     }

//     const data = await res.json();
//     const addr = data.address || {};
//     const label =
//       addr.city ||
//       addr.town ||
//       addr.village ||
//       addr.municipality ||
//       addr.county ||
//       addr.state ||
//       addr.country ||
//       'Unknown';

//     cache.set(key, label);
//     return { key, place: label };
//   } catch (e) {
//     cache.set(key, 'Unknown');
//     return { key, place: 'Unknown' };
//   }
// }

// // GET /geocode?lat=..&lng=..
// exports.geocode = async (req, res) => {
//   try {
//     const lat = Number(req.query.lat);
//     const lng = Number(req.query.lng);
//     if (Number.isNaN(lat) || Number.isNaN(lng)) {
//       return res.status(400).json({ message: 'Invalid lat/lng' });
//     }
//     const { place } = await reverseOne(lat, lng);
//     res.json({ place });
//   } catch {
//     res.status(500).json({ message: 'Geocode error' });
//   }
// };

// // POST /geocode/batch  { coords: [{lat,lng}, ...] }
// exports.batchGeocode = async (req, res) => {
//   try {
//     const coords = Array.isArray(req.body.coords) ? req.body.coords : [];
//     // de-duplicate by rounded key
//     const unique = new Map();
//     for (const c of coords.slice(0, 1000)) {
//       const lat = Number(c.lat);
//       const lng = Number(c.lng);
//       if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
//         const key = `${round3(lat)},${round3(lng)}`;
//         if (!unique.has(key)) unique.set(key, { lat, lng });
//       }
//     }

//     const results = {};
//     const keys = Array.from(unique.keys());
//     const vals = keys.map(k => unique.get(k));

//     // process in CHUNKS with LIMITED CONCURRENCY (fast but polite)
//     const CONCURRENCY = 8;       // up to 8 lookups at once
//     const CHUNK_DELAY_MS = 200;  // small pause between chunks

//     for (let i = 0; i < vals.length; i += CONCURRENCY) {
//       const slice = vals.slice(i, i + CONCURRENCY);
//       // do this chunk in parallel
//       const chunkRes = await Promise.all(
//         slice.map(({ lat, lng }) => reverseOne(lat, lng))
//       );
//       // save results from this chunk
//       for (const r of chunkRes) {
//         results[r.key] = r.place;
//       }
//       // tiny delay between chunks
//       if (i + CONCURRENCY < vals.length) {
//         await new Promise(r => setTimeout(r, CHUNK_DELAY_MS));
//       }
//     }

//     res.json({ results });
//   } catch (e) {
//     res.status(500).json({ message: 'Batch geocode error' });
//   }
// };
