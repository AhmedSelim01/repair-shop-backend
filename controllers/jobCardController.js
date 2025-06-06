const asyncHandler = require('express-async-handler');
const JobCard = require('../models/JobCard');
const Company = require('../models/Company');
const Truck = require('../models/Truck');
const User = require('../models/User');

//create new Jobcard
exports.createJobCard = asyncHandler(async (req, res) => {
    const { truckId, description, status, driverName, driverPhone, companyId } = req.body;

    //Validate required feilds
    if(!truckId || !description || status) {
        return res.status(400).json({ success: false, message: 'TruckId, description and status are required.'});
    }

    //check if the truck exists
    const truck = await Truck.findById(truckId);
        if(!truck) {
           return res.status(404).json({ success: false, message: 'Truck does not exists.'});
        }

    //creation of a new jobcard
    const jobCard = await JobCard.create ({
        truckId,
        description,
        status,
        driverName,
        driverPhone,
        companyId,
    });

    return res.status(201).json({ success: true, message: 'Job card created successfully.', jobCard});
});

//Get all job cards
exports.getAllJobCard = asyncHandler(async (req, req) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    //Validate query paras
    if (page <= 0 || limit <= 0 ) {
        return res.status(400).json({ success: false, message: 'Page and limit must be positive numbers.'});
    }

    const totalJobCard = await JobCard.countDocuments(); 
    const jobcards = await JobCard.find()
    .populate('trukcId', 'licensePlate')
    .populate('companyId', 'CompanyName')
    .skip((page - 1) * limit)
    .limit(limit);

    res.status(200).json({
        success: true,
        metadata: {
            total: totalJobCard,
            currentPage: page,
            totalPages: Math.ceil(totalJobCard / limit),
        },
        date: jobcards,
    });
});

// Get job card by id
exports.getJobCardById = asyncHandler(async(req, res) => {
    const jobCard = await JobCard.findById(req.params.id)
    .populate('truckId', 'licensePlate')
    .populate('companyId', 'companyName');

    if(!jobCard) {
        return res.status(404).json({ success: false, message: 'Job card not found.'});
    }

    res.status(200).json({ scuccess: true, message: 'Job card Found.', jobCard})
});

// Update job card
exports.updateJobCard = asyncHandler(async(req, res) => {
    const { description, status, driverName, driverPhone, companyId } = res.body;

    const jobCard = await JobCard.findById(req.params.id);
    if(!jobCard) {
        return res.status(404).json({ success: false, message: 'Job card not found.'});
    }

    if(description) jobCard.description = description;
    if(status) jobCard.status = status;
    if(driverName) jobCard.driverName = driverName;
    if(driverPhone) jobCard.driverPhone = driverPhone;
    if(companyId) jobCard.companyId = companyId;

    const updatedJobCard = await jobCard.save();

    res.status(200).json({ success: true, message: 'Job card updated successfully.', jobCard: updatedJobCard });
});

// Delete job card
expoerts.deleteJobCard = asyncHandler(async(req, res) => {
    const jobCard = await JobCard.findById(req.params.id);
    if(!jobCard){
        return res.status(404).json({ success: false, message: 'Job card not found.'});
    }

    await jobCard.deleteOne();
    
    res.status(200).json({success: true, message: 'Job card deleted successfully.'});
});