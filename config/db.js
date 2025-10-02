const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;














// // config/db.js
// const mongoose = require('mongoose');
// require('dotenv').config(); // Load environment variables from .env file

// const mongoUri = process.env.MONGO_URI || 'mongodb+srv://senurabawantha_db_user:koOuQbtRbIJcI4sd@bus-traking-api.hxctmjs.mongodb.net/?retryWrites=true&w=majority&appName=bus-traking-api'; // Default to local DB if not set

// const connectDB = async () => {
//   try {
//     await mongoose.connect(mongoUri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });
//     console.log('MongoDB connected successfully');
//   } catch (err) {
//     console.error('Error connecting to MongoDB:', err);
//     process.exit(1); // Exit the process if DB connection fails
//   }
// };

// module.exports = connectDB;
