// Import required dependencies for authentication functionality
const User = require('../models/User');
const asyncHandler = require('express-async-handler'); // Handles async errors automatically
const jwt = require('jsonwebtoken'); // For creating and verifying JWT tokens
const crypto = require('crypto'); // For generating secure random codes
const passwordResetLimiter = require('../models/RateLimiter'); // Rate limiting for security
require('dotenv').config(); // Load environment variables

/**
 * Utility function to generate JWT tokens for authenticated users
 * @param {Object} user - User object from database
 * @returns {String} - Signed JWT token containing user info
 */
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id,    // User's unique database ID
            role: user.role, // User's role for authorization
            email: user.email // User's email for identification
        },
        process.env.JWT_SECRET, // Secret key from environment variables
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } // Token expiration (default 1 day)
    );
};

/**
 * USER REGISTRATION ENDPOINT
 * Handles new user registration with role-based field validation
 * Prevents duplicate accounts and enforces business rules
 */
exports.registerUser = asyncHandler(async (req, res) => {
    // Extract all possible fields from request body
    const { name, phone, email, password, companyName, licensePlate, driverInfo, role } = req.body;

    // Basic validation - password is mandatory for all users
    if (!password) {
        return res.status(400).json({ message: 'Password is required.' });
    }

    // DUPLICATE PREVENTION: Check if email or phone already exists in database
    // Using MongoDB $or operator to check multiple conditions
    const duplicateUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (duplicateUser) {
        // Build detailed error message showing which fields conflict
        const conflicts = [];
        if (duplicateUser.email === email) conflicts.push('email');
        if (duplicateUser.phone === phone) conflicts.push('phone number');
        return res.status(400).json({
            message: `The following fields already exist: ${conflicts.join(', ')}.`,
        });
    }

    const user = await User.create({
        name,
        email, 
        password,
        phone: role !== 'admin' ? phone : undefined, // Include phone if not admin
        companyName: role === 'company' ? companyName : undefined, // Only for companies
        licensePlate: role === 'truck_owner' ? licensePlate : undefined, // Only for truck owners
        driverInfo: role === 'company' ? driverInfo : undefined, // Only for companies
        role,
    });

    res.status(201).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user),
        message: 'User registered successfully.',
    });
});

/**
 * USER LOGIN ENDPOINT
 * Authenticates users and returns JWT token for session management
 * Uses bcrypt for secure password comparison
 */
exports.loginUser = asyncHandler(async (req,res) => {
    const { email, password } = req.body;

    // INPUT VALIDATION: Ensure both email and password are provided
    if(!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    // DATABASE LOOKUP: Find user by email (case-insensitive due to schema)
    const user = await User.findOne({ email });
    
    // AUTHENTICATION CHECK: Verify user exists and password matches
    // user.matchPassword() is a custom method that uses bcrypt.compare()
    if (user && (await user.matchPassword(password))) {
        // SUCCESS: Return user data and JWT token for future requests
        res.status(200).json({ 
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role, // Important for role-based access control
            token: generateToken(user), // JWT token for authentication
        });
    } else {
        // FAILURE: Generic error message for security (don't reveal if email exists)
        res.status(400).json({ message: 'Invalid email or password.' });
    }
});

// Request password reset code
exports.requestResetCode = asyncHandler(async (req, res) => {
    const { email, phone } = req.body;

    // Apply rate limiting
    try{
        await passwordResetLimiter.consume(req.ip);
    }catch (error) {
        return res.status(429).json({succes: false, message: 'Too many password reset requests. Please try again after 1 day.'});
    }

    if (!email && !phone) {
        res.status(400);
        throw new Error('Email or phone number is required.');
    }

    const user = await User.findOne({ $or: [{ email }, { phone }] });
    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    const resetCode = crypto.randomInt(100000, 999999).toString();
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 5 * 60 * 1000; // Expires in 5 minutes
    await user.save();
    res.status(200).json({ success: true, message: `Reset code sent to ${email, phone}, Reset code: ${resetCode}.` });
});

// Password reset code verification
exports.resetPassword = asyncHandler(async (req, res) => {
    const { email, phone, resetCode, newPassword } = req.body;

    // Apply rate limiting
    try{
        await passwordResetLimiter.consume(req.ip);
    }catch (error) {
        return res.status(429).json({succes: false, message: 'Too many password reset requests. Please try again after 1 day.'});
    }

    const user = await User.findOne({ $or: [{ email }, { phone }] });
    if (!user || user.resetCode !== resetCode || user.resetCodeExpires < Date.now()) {
        res.status(400);
        throw new Error('Invalid or expired reset code.');
    }

    user.password = newPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
});