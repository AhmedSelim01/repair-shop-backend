const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema(
    {
        // Driver Basic Info
        driverName: { type: String, required: true, trim: true },
        driverPhone: {
            type: String,
            required: true,
            validate: {
                validator: (v) => /^[0-9]{10}$/.test(v),
                message: (props) => `${props.value} is not a valid phone number!`
            }
        },
        driverIdNumber: { type: String, required: true },
        licensePlate: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: (v) => /^[A-Z0-9-]+$/.test(v),
                message: (props) => `${props.value} is not a valid license plate!`
            }
        },
        emergencyContact: {
            name: { type: String, required: true, trim: true },
            phone: {
                type: String,
                validate: {
                    validator: (v) => /^[0-9]{10}$/.test(v),
                    message: (props) => `${props.value} is not a valid phone number!`
                }
            }
        },
        // User reference
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        // Company association
        associatedCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
        // For unregistered company drivers
        externalCompanyDetails: {
            companyName: String,
            contactPerson: String,
            contactNumber: String,
            contactEmail: String
        },
        isRegisteredCompanyDriver: { type: Boolean, default: false },
        truckNumber: String
    },
    { timestamps: true }
);

// Indexes
DriverSchema.index({ driverPhone: 1 });
DriverSchema.index({ licensePlate: 1 });
DriverSchema.index({ userId: 1 });

// Create Driver model
const Driver = mongoose.model('Driver', DriverSchema);
module.exports = Driver;