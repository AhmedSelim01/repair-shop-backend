const dotenv = require('dotenv');
dotenv.config();

// ===== IMPORT CORE DEPENDENCIES =====
const express = require('express'); // Web framework
const cors = require('cors'); // Cross-Origin Resource Sharing
const connectDB = require('./config/db'); // Database connection
const logger = require('./config/logger'); // Winston logging system
const { specs, swaggerUi } = require('./config/swagger'); // API documentation UI and Swagger configuration
const { setupSecurity, rateLimiters } = require('./middleware/security'); // Security headers and rate limiting

const authRoutes = require('./routes/authRoutes'); // Authentication routes
const userRoutes = require('./routes/userRoutes'); // User-related routes
const companyRoutes = require('./routes/companyRoutes');
const roleTransitionRoutes = require('./routes/roleTransitionRoutes'); // Role transition routes
const driverRoutes = require('./routes/driverRoutes');
const truckRoutes = require('./routes/truckRoutes');
const jobCardRoutes = require('./routes/jobCardRoutes');
const healthRoutes = require('./routes/healthRoutes');
const storeRoutes = require('./routes/storeRoutes');
const cartRoutes = require('./routes/cartRoutes');

// Initialize Express application
const app = express();

/**
 * DATABASE CONNECTION
 * Establishes connection to MongoDB using Mongoose
 * Handles connection errors and logs success/failure
 */
connectDB();

// Security setup
setupSecurity(app);

// Middleware setup
app.use(express.json({ limit: '10mb' })); // Parses JSON data in requests with size limit
app.use(cors()); // Enables cross-origin resource sharing

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  next();
});

// Health check routes
app.use('/health', healthRoutes);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Mount routes with rate limiting
app.use('/api/auth', rateLimiters.auth, authRoutes); // Authentication endpoints
app.use('/api/users', userRoutes); // User endpoints
app.use('/api/companies', companyRoutes); // Company endpoints
app.use('/api/role-transition', roleTransitionRoutes); // role transition endpoint
app.use('/api/drivers', driverRoutes); // driver endpoints
app.use('/api/trucks', truckRoutes); // truck endpoints
app.use('/api/jobcard', jobCardRoutes); // jobcard endpoints
app.use('/api/store', storeRoutes);
app.use('/api/cart', cartRoutes);

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