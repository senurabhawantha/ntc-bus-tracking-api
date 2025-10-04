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

