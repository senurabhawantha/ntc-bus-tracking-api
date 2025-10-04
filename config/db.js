








// config/db.js
const mongoose = require("mongoose");

function redact(uri) {
  if (!uri) return "";
  try {
    const u = new URL(uri);
    if (u.password) u.password = "****";
    if (u.username) u.username = "****";
    return u.toString();
  } catch {
    return uri.replace(/\/\/([^:/]+):([^@]+)@/, "//****:****@");
  }
}

function getMongoUri() {
  const { MONGO_URI, MONGO_LOCAL_URI } = process.env;
  // Prefer explicit cloud URI; fall back to local if empty/missing
  if (MONGO_URI && MONGO_URI.trim().length > 0) return MONGO_URI.trim();
  return (MONGO_LOCAL_URI && MONGO_LOCAL_URI.trim().length > 0)
    ? MONGO_LOCAL_URI.trim()
    : "mongodb://127.0.0.1:27017/bus_tracking";
}

async function connectDB() {
  const uri = getMongoUri();
  const redacted = redact(uri);

  console.log(`[DB] Connecting to Mongo: ${redacted}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10s
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      family: 4, // prefer IPv4 to dodge some SRV/DNS quirks
    });

    console.log("[DB] Connected");
    mongoose.connection.on("error", (err) => {
      console.error("[DB] Connection error:", err?.message || err);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("[DB] Disconnected");
    });
  } catch (err) {
    console.error("[DB] Initial connection failed:", err?.message || err);
    console.error(
      "[DB] If this is Mongo Atlas, double-check:\n" +
      "  • Username/password\n" +
      "  • Database name in the connection string\n" +
      "  • IP whitelist / Network Access\n" +
      "Or leave MONGO_URI empty to use local Mongo via MONGO_LOCAL_URI."
    );
    process.exit(1);
  }
}

module.exports = { connectDB, getMongoUri };









// // config/db.js
// const mongoose = require('mongoose');
// require('dotenv').config();

// module.exports = async function connectDB() {
//   const uri = process.env.MONGO_URI;
//   if (!uri) {
//     console.error('MONGO_URI missing in .env');
//     process.exit(1);
//   }

//   try {
//     // await mongoose.connect(uri, {
//     //   // Increase timeouts to see if slow networks succeed
//     //   serverSelectionTimeoutMS: 60000, // 60s to find a server
//     //   connectTimeoutMS: 30000,         // 30s TCP connect
//     //   // Avoid IPv6 DNS issues on some Windows networks
//     //   family: 4,
//     //   // TLS is implied for SRV, but explicit is fine:
//     //   tls: true,
//     // });

//     await mongoose.connect(process.env.MONGO_URI, {
//   serverSelectionTimeoutMS: 30000,
//   socketTimeoutMS: 45000,
//   family: 4,
//   maxPoolSize: 10,
//   keepAlive: true,
//   keepAliveInitialDelay: 300000,
// });



//     console.log('MongoDB connected successfully');
//   } catch (err) {
//     console.error('Error connecting to MongoDB:', err);
//     process.exit(1);
//   }

//   // optional: verbose debug
//   // mongoose.set('debug', true);
// };








// // const mongoose = require('mongoose');
// // require('dotenv').config();

// // const connectDB = async () => {
// //   try {
// //     await mongoose.connect(process.env.MONGO_URI, { 
// //       useNewUrlParser: true, 
// //       useUnifiedTopology: true 
// //     });
// //     console.log('MongoDB connected successfully');
// //   } catch (err) {
// //     console.error('Error connecting to MongoDB:', err);
// //     process.exit(1);
// //   }
// // };

// // module.exports = connectDB;
