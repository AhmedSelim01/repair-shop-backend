const mongoose = require('mongoose');
const { Schema } = mongoose;

const CompanyOwnerDetailsSchema = new Schema(
    {
        // Owner Full Name
        ownerFullName: {
            type: String,
            required: true,
            trim: true,
        },
        // Owner ID Number
        ownerIdNumber: {
            type: String,
            required: true,
            validate: {
                validator: (v) => /^[0-9]{8,15}$/.test(v),
                message: (props) => `${props.value} is not a valid ID number!`,
            },
        },
        // Owner Passport Number
        ownerPassportNumber: {
            type: String,
            trim: true,
            default: null,
        },
        // Owner Address
        ownerAddress: {
            type: String,
            trim: true,
            default: null,
        },
        // Owner Phone
        ownerPhone: {
            type: String,
            required: true,
            validate: {
                validator: (v) => /^[0-9]{10}$/.test(v),
                message: (props) => `${props.value} is not a valid phone number!`,
            },
        },
        // Owner Email
        ownerEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: (v) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v),
                message: (props) => `${props.value} is not a valid email address!`,
            },
        },
    },
    { timestamps: true }
);

// Indexes
CompanyOwnerDetailsSchema.index({ ownerIdNumber: 1 }, { unique: true });
CompanyOwnerDetailsSchema.index({ ownerEmail: 1 }, { unique: true });

module.exports = CompanyOwnerDetailsSchema;