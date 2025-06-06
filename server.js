const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Import the database connection utility
const mongoose = require('mongoose'); // For database connection and graceful shutdown
const errorHandler = require('./middleware/errorHandler'); // Central error handler     

const authRoutes = require('./routes/authRoutes'); // Authentication routes
const userRoutes = require('./routes/userRoutes'); // User-related routes
const companyRoutes = require('./routes/companyRoutes');
const roleTransitionRoutes = require('./routes/roleTransitionRoutes'); // Role transition routes
const driverRoutes = require('./routes/driverRoutes');
const truckRoutes = require('./routes/truckRoutes');
const jobCardRoutes = require('./routes/jobCardRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware setup
app.use(express.json()); // Parses JSON data in requests
app.use(cors()); // Enables cross-origin resource sharing

// Mount routes
app.use('/api/auth', authRoutes); // Authentication endpoints
app.use('/api/users', userRoutes); // User endpoints
app.use('/api/companies', companyRoutes); // Company endpoints
app.use('/api/role-transition', roleTransitionRoutes); // role transition endpoint
app.use('/api/drivers', driverRoutes); // driver endpoints
app.use('/api/trucks', truckRoutes); // truck endpoints
app.use('/api/jobcard', jobCardRoutes); // jobcard endpoints

// Example route to check server setup
app.get('/', (req, res) => {
    res.send('Repair Shop API is running');
});

// Error-Handling Middleware
app.use(errorHandler); // Centralized error handling middleware

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed. Exiting process.');
    process.exit(0);
});

// a health check on the server’s status
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});