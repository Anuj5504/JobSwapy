const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const mongoose = require("mongoose");

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/job');
const userRoutes = require('./routes/user');
const roadmapRoutes = require('./routes/roadmap');
const communityRoutes = require('./routes/communityRoutes');
const interviewRoutes = require('./routes/interview.js');
const reminderRoutes = require('./routes/reminderRoutes');
const app = express();

mongoose.set('bufferTimeoutMS', 30000);

// mongoose.connect(process.env.MONGO_URI)
//     .then(() => console.log("MongoDB connected successfully"))
//     .catch((error) => console.error("MongoDB connection failed:", error));

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MongoDB URI not found in environment variables");
  process.exit(1);
}

// Create a promise for connection to use in other modules
const dbConnection = mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase server selection timeout
  socketTimeoutMS: 45000, // Increase socket timeout
})
  .then((mongoose) => {
    console.log("MongoDB connected successfully");
    return mongoose;
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1); // Exit on connection failure
  });

module.exports.dbConnection = dbConnection;

// Start the job notification scheduler after DB connection
dbConnection.then(() => {
  console.log("Starting job notification service...");
  try {
    // Import and start scheduler (notifications will be enabled)
    const { jobNotificationsSchedule } = require('./scheduler');
    console.log("Job notification service is enabled and emails will be sent automatically");
  } catch (err) {
    console.error("Failed to start job notification scheduler:", err.message);
  }
});

// Simplified CORS setup
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/reminders', reminderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));