const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passwordResetLimiter = require('../models/RateLimiter');
require('dotenv').config();

// Utility to generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
};

// User Registration
exports.registerUser = asyncHandler(async (req, res) => {
    const { name, phone, email, password, companyName, licensePlate, driverInfo, role } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password is required.' });
    }

    // Check for duplicate email or phone
    const duplicateUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (duplicateUser) {
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

// User login
exports.loginUser = asyncHandler(async (req,res) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if(!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    // Check if the user exists and if the password matches
    if (user && (await user.matchPassword(password))) {
        res.status(200).json({ 
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user),
        });
    } else {
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