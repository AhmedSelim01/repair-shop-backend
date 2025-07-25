// controllers/truckController.js
const asyncHandler = require('express-async-handler');
const Truck = require('../models/Truck');
const User = require('../models/User');
const Company = require('../models/Company');

exports.createTruck = asyncHandler(async (req, res, next) => {
    try {
        const { licensePlate, brand, companyId } = req.body;
        
        // Check if truck already exists
        const existingTruck = await Truck.findOne({ licensePlate });
        if (existingTruck) {
            return res.status(400).json({
                success: false,
                message: 'Truck with this license plate already exists.'
            });
        }

        const truckData = {
            licensePlate,
            brand,
            owner: req.user.id,
            status: 'pending'
        };

        if (companyId) {
            const company = await Company.findById(companyId);
            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Company not found.'
                });
            }
            truckData.companyId = companyId;
        }

        const truck = await Truck.create(truckData);

        // Update user's associated trucks
        await User.findByIdAndUpdate(
            req.user.id,
            { $push: { associatedTrucks: truck._id } }
        );

        // If company provided, update company's associated trucks
        if (companyId) {
            await Company.findByIdAndUpdate(
                companyId,
                { $push: { associatedTrucks: truck._id } }
            );
        }

        res.status(201).json({
            success: true,
            message: 'Truck registered successfully.',
            truck
        });
    } catch (error) {
        next(error);
    }
});

exports.getAllTrucks = asyncHandler(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

    // Validate query params
    if (page <= 0 || limit <= 0) {
        res.status(400);
        throw new Error('Page and limit must be positive numbers.');
    }

        const totalTrucks = await Truck.countDocuments();
        const trucks = await Truck.find()
            .populate('owner', 'name email')
            .populate('companyId', 'companyName')
            .populate('currentJobCardId')
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            metadata: {
                total: totalTrucks,
                currentPage: page,
                totalPages: Math.ceil(totalTrucks / limit),
            },
            data: trucks,
        });
    } catch (error) {
        next(error);
    }
});

exports.getTruckById = asyncHandler(async (req, res, next) => {
    try {
        const truck = await Truck.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('companyId', 'companyName')
            .populate('currentJobCardId')
            .populate('repairHistory');

        if (!truck) {
            return res.status(404).json({
                success: false,
                message: 'Truck not found.'
            });
        }

        res.status(200).json({
            success: true,
            truck
        });
    } catch (error) {
        next(error);
    }
});

exports.updateTruck = asyncHandler(async (req, res, next) => {
    try {
        const { brand, status, repairMilestones } = req.body;

        const truck = await Truck.findById(req.params.id);
        if (!truck) {
            return res.status(404).json({
                success: false,
                message: 'Truck not found.'
            });
        }

        // Only allow owner or associated company to update
        if (truck.owner.toString() !== req.user.id && 
            truck.companyId?.toString() !== req.user.companyId?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this truck.'
            });
        }

        if (brand) truck.brand = brand;
        if (status) truck.status = status;
        if (repairMilestones) {
            truck.repairMilestones.push(...repairMilestones);
        }

        const updatedTruck = await truck.save();

        res.status(200).json({
            success: true,
            message: 'Truck updated successfully.',
            truck: updatedTruck
        });
    } catch (error) {
        next(error);
    }
});

exports.deleteTruck = asyncHandler(async (req, res, next) => {
    try {
        const truck = await Truck.findById(req.params.id);
        if (!truck) {
            return res.status(404).json({
                success: false,
                message: 'Truck not found.'
            });
        }

        // Only allow owner to delete
        if (truck.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this truck.'
            });
        }

        // Remove truck reference from owner's associated trucks
        await User.findByIdAndUpdate(
            truck.owner,
            { $pull: { associatedTrucks: truck._id } }
        );

        // If associated with company, remove from company's trucks
        if (truck.companyId) {
            await Company.findByIdAndUpdate(
                truck.companyId,
                { $pull: { associatedTrucks: truck._id } }
            );
        }

        await truck.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Truck deleted successfully.'
        });
    } catch (error) {
        next(error);
    }
});

exports.updateTruckRepairStatus = asyncHandler(async (req, res, next) => {
    try {
        const { stage } = req.body;
        
        if (!['inspection', 'repair in progress', 'quality check', 'ready for pick-up'].includes(stage)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid repair stage.'
            });
        }

        const truck = await Truck.findById(req.params.id);
        if (!truck) {
            return res.status(404).json({
                success: false,
                message: 'Truck not found.'
            });
        }

        truck.repairMilestones.push({
            stage,
            completedAt: new Date()
        });

        if (stage === 'ready for pick-up') {
            truck.status = 'finalized';
        }

        const updatedTruck = await truck.save();

        res.status(200).json({
            success: true,
            message: 'Repair status updated successfully.',
            truck: updatedTruck
        });
    } catch (error) {
        next(error);
    }
});