const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { default: mongoose } = require('mongoose');

// Get all users
exports.getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Validate query params
    if (page <= 0 || limit <= 0) {
        res.status(400);
        throw new Error('Page and limit must be positive numbers.');
    }

    const totalUsers = await User.countDocuments();
    const users = await User.find()
        .select('-password')
        .skip((page - 1) * limit)
        .limit(limit);

    res.status(200).json({
        success: true,
        metadata: {
            total: totalUsers,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
        },
        data: users,
    });
});

// Get user by ID
exports.getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid user ID format.');
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    res.status(200).json({ success: true, data: user });
});

// Update user
exports.updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid user ID format.');
    }

    const updates = { ...req.body };

    // Restrict sensitive fields
    const restrictedFields = ['role', 'password', 'resetCode', 'resetCodeExpires'];
    restrictedFields.forEach(field => delete updates[field]);

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!updatedUser) {
        res.status(404);
        throw new Error('User not found.');
    }

    res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        data: updatedUser,
    });
});

// Delete user
exports.deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid user ID format.');
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
        res.status(404);
        throw new Error('User not found.');
    }

    res.status(200).json({
        success: true,
        message: 'User deleted successfully.',
        data: deletedUser,
    });
    console.log(`User deleted: ${deletedUser._id}`);
});