// scripts/reseedFromJson.js
require("dotenv").config(); // make sure env is loaded before anything else

const path = require("path");
const fs = require("fs/promises");
const mongoose = require("mongoose");
const { getMongoUri } = require("../config/db");

// Adjust model paths if your project uses different filenames/locations
const Route = require("../models/route");
const Bus = require("../models/bus");

async function connect() {
  const uri = getMongoUri();
  const redacted = uri.replace(/\/\/([^:/]+):([^@]+)@/, "//****:****@");
  console.log(`[Reseed] Connecting to Mongo: ${redacted}`);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    family: 4,
  });
  console.log("[Reseed] Connected");
}

async function reseed() {
  const dataFile = path.join(__dirname, "..", "data", "busSimulation.json");

  let raw;
  try {
    raw = await fs.readFile(dataFile, "utf-8");
  } catch (e) {
    console.error(`[Reseed] Could not read ${dataFile}. Make sure it exists.`);
    throw e;
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error("[Reseed] Invalid JSON in data/busSimulation.json");
    throw e;
  }

  const routes = Array.isArray(json.routes) ? json.routes : [];
  const buses = Array.isArray(json.buses) ? json.buses : [];

  console.log(`[Reseed] Purging collections…`);
  await Promise.all([
    Route.deleteMany({}),
    Bus.deleteMany({})
  ]);

  if (routes.length) {
    console.log(`[Reseed] Inserting ${routes.length} routes…`);
    await Route.insertMany(routes);
  } else {
    console.warn("[Reseed] No routes found in JSON.");
  }

  if (buses.length) {
    console.log(`[Reseed] Inserting ${buses.length} buses…`);
    await Bus.insertMany(buses);
  } else {
    console.warn("[Reseed] No buses found in JSON.");
  }

  console.log("[Reseed] Done.");
}

(async () => {
  try {
    await connect();
    await reseed();
  } catch (err) {
    console.error("❌ Reseed failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
})();

