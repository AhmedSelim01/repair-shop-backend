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

// New routes
const adminPanelRoutes = require('./routes/adminPanelRoutes'); // Admin panel routes - NEW
const notificationRoutes = require('./routes/notificationRoutes'); // Notification routes - NEW
const paymentRoutes = require('./routes/paymentRoutes'); // Payment routes - NEW

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

// Register API routes with centralized prefix
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/role-transition', roleTransitionRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/jobcard', jobCardRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminPanelRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/health', healthRoutes);

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

// --- START OF NEW FILES ---

// config/emailService.js - NEW
// Enhanced email service
const nodemailer = require('nodemailer');
const logger2 = require('./logger');

const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendEmail(to, subject, html) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: html,
        });
        logger2.info(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger2.error(`Error sending email: ${error}`);
        throw error;
    }
}

module.exports = { sendEmail };

// --- Admin Panel Controller ---
// controllers/adminPanelController.js - NEW
const User = require('../models/User');
const Company = require('../models/Company');
const JobCard = require('../models/JobCard');
const logger3 = require('../config/logger');

const getDashboardData = async (req, res) => {
    try {
        const userCount = await User.countDocuments({});
        const companyCount = await Company.countDocuments({});
        const jobCardCount = await JobCard.countDocuments({});

        res.status(200).json({
            userCount,
            companyCount,
            jobCardCount,
            message: "Admin Dashboard data fetched successfully"
        });
    } catch (error) {
        logger3.error(`Error fetching dashboard data: ${error}`);
        res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
};

module.exports = { getDashboardData };

// --- Notification Controller ---
// controllers/notificationController.js - NEW
const { sendEmail } = require('../config/emailService');
const logger4 = require('../config/logger');

const sendNotification = async (req, res) => {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        await sendEmail(to, subject, html);
        res.status(200).json({ message: 'Notification sent successfully' });
    } catch (error) {
        logger4.error(`Error sending notification: ${error}`);
        res.status(500).json({ message: 'Error sending notification', error: error.message });
    }
};

module.exports = { sendNotification };

// --- Payment Controller ---
// controllers/paymentController.js - NEW
const logger5 = require('../config/logger');

const processPayment = async (req, res) => {
    const { amount, token } = req.body;

    if (!amount || !token) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Simulate payment processing
        console.log('Payment processed successfully');
        res.status(200).json({ message: 'Payment processed successfully' });
    } catch (error) {
        logger5.error(`Error processing payment: ${error}`);
        res.status(500).json({ message: 'Error processing payment', error: error.message });
    }
};

module.exports = { processPayment };

// --- Admin Panel Routes ---
// routes/adminPanelRoutes.js - NEW
const express2 = require('express');
const router = express2.Router();
const adminPanelController = require('../controllers/adminPanelController');

router.get('/dashboard', adminPanelController.getDashboardData);

module.exports = router;

// --- Notification Routes ---
// routes/notificationRoutes.js - NEW
const express3 = require('express');
const router2 = express3.Router();
const notificationController = require('../controllers/notificationController');

router2.post('/send', notificationController.sendNotification);

module.exports = router2;

// --- Payment Routes ---
// routes/paymentRoutes.js - NEW
const express4 = require('express');
const router3 = express4.Router();
const paymentController = require('../controllers/paymentController');

router3.post('/process', paymentController.processPayment);

module.exports = router3;

// Error handling middleware - Centralized error handler, place after route definitions
function errorHandler(err, req, res, next) {
    console.error(err.stack);

    // Customize error messages based on the error type or status code
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation Error', message: err.message });
    }

    // Log the error using Winston logger
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    // Generic error response
    res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong!' });
}
// --- END OF NEW FILES ---
```

```analysis
The code integrates new controllers (admin panel, notification, payment) with corresponding routes, alongside an enhanced email service and updates to the main server file to include these routes. It also includes an error handler and logger.
```

```replit_final_file
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

// New routes
const adminPanelRoutes = require('./routes/adminPanelRoutes'); // Admin panel routes - NEW
const notificationRoutes = require('./routes/notificationRoutes'); // Notification routes - NEW
const paymentRoutes = require('./routes/paymentRoutes'); // Payment routes - NEW

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

// Register API routes with centralized prefix
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/role-transition', roleTransitionRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/jobcard', jobCardRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminPanelRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/health', healthRoutes);

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

// --- START OF NEW FILES ---

// config/emailService.js - NEW
// Enhanced email service
const nodemailer = require('nodemailer');
const logger2 = require('./config/logger');

const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendEmail(to, subject, html) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: html,
        });
        logger2.info(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger2.error(`Error sending email: ${error}`);
        throw error;
    }
}

module.exports = { sendEmail };

// --- Admin Panel Controller ---
// controllers/adminPanelController.js - NEW
const User = require('../models/User');
const Company = require('../models/Company');
const JobCard = require('../models/JobCard');
const logger3 = require('../config/logger');

const getDashboardData = async (req, res) => {
    try {
        const userCount = await User.countDocuments({});
        const companyCount = await Company.countDocuments({});
        const jobCardCount = await JobCard.countDocuments({});

        res.status(200).json({
            userCount,
            companyCount,
            jobCardCount,
            message: "Admin Dashboard data fetched successfully"
        });
    } catch (error) {
        logger3.error(`Error fetching dashboard data: ${error}`);
        res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
};

module.exports = { getDashboardData };

// --- Notification Controller ---
// controllers/notificationController.js - NEW
const { sendEmail } = require('../config/emailService');
const logger4 = require('../config/logger');

const sendNotification = async (req, res) => {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        await sendEmail(to, subject, html);
        res.status(200).json({ message: 'Notification sent successfully' });
    } catch (error) {
        logger4.error(`Error sending notification: ${error}`);
        res.status(500).json({ message: 'Error sending notification', error: error.message });
    }
};

module.exports = { sendNotification };

// --- Payment Controller ---
// controllers/paymentController.js - NEW
const logger5 = require('../config/logger');

const processPayment = async (req, res) => {
    const { amount, token } = req.body;

    if (!amount || !token) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Simulate payment processing
        console.log('Payment processed successfully');
        res.status(200).json({ message: 'Payment processed successfully' });
    } catch (error) {
        logger5.error(`Error processing payment: ${error}`);
        res.status(500).json({ message: 'Error processing payment', error: error.message });
    }
};

module.exports = { processPayment };

// --- Admin Panel Routes ---
// routes/adminPanelRoutes.js - NEW
const express2 = require('express');
const router = express2.Router();
const adminPanelController = require('../controllers/adminPanelController');

router.get('/dashboard', adminPanelController.getDashboardData);

module.exports = router;

// --- Notification Routes ---
// routes/notificationRoutes.js - NEW
const express3 = require('express');
const router2 = express3.Router();
const notificationController = require('../controllers/notificationController');

router2.post('/send', notificationController.sendNotification);

module.exports = router2;

// --- Payment Routes ---
// routes/paymentRoutes.js - NEW
const express4 = require('express');
const router3 = express4.Router();
const paymentController = require('../controllers/paymentController');

router3.post('/process', paymentController.processPayment);

module.exports = router3;

// Error handling middleware - Centralized error handler, place after route definitions
function errorHandler(err, req, res, next) {
    console.error(err.stack);

    // Customize error messages based on the error type or status code
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation Error', message: err.message });
    }

    // Log the error using Winston logger
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    // Generic error response
    res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong!' });
}
// --- END OF NEW FILES ---