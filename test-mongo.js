// test-mongo.js
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      family: 4,
    });
    console.log('Connected OK');
    process.exit(0);
  } catch (e) {
    console.error('FAILED:', e.message);
    if (e.reason) console.error('Reason:', e.reason);
    process.exit(1);
  }
})();
