const express = require('express');
const {
    registerUser,
    loginUser,
    requestResetCode,
    resetPassword,
} = require('../controllers/authController');
const router = express.Router();

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/password-reset/request', requestResetCode);
router.post('/password-reset/verify', resetPassword);

module.exports = router; 