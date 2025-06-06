const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Company = require('./Company');
const {v4: uuidv4 } = require('uuid');
const { parsePhoneNumberWithError } = require('libphonenumber-js');

// Define the main User schema
const UserSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { 
      type: String, 
      trim: true, 
      required: function() {
        // Name is required for roles: general, employee, truck_owner
        return ['general', 'employee', 'truck_owner'].includes(this.role);
      }
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
      validate: {
        validator: (value) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
        message: 'Invalid email format.'
      }
    },
    phone: {
      type: String,
      unique: true,
      required: function() {
        // Phone is required for all roles except admin
        return this.role !== "admin";
      },
      validate: {
        validator: function(value) {
          if (!value) return true;
          try {
            // Use the new API to parse and validate the phone number
            const phoneNumber = parsePhoneNumberWithError(value, 'AE');
            return phoneNumber.isValid();
          } catch (err) {
            return false;
          }
        },
        message: 'Phone must be a valid international number.'
      }
    },
    password: { 
      type: String, 
      required: true, 
      minlength: 8,
      validate: {
        validator: function(value) {
          const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return passwordRegex.test(value);
        },
        message: 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.'
      }
    },

    // Role-Specific Info
    licensePlate: {
      type: String,
      required: function() {
        // License plate is required for truck owners
        return this.role === 'truck_owner';
      },
      validate: {
        validator: (value) => /^[A-Z0-9-]{2,11}$/.test(value),
        message: 'License plate must be 2-11 characters (A-Z, 0-9, hyphens)'
      }
    },
    role: {
      type: String,
      enum: ['general', 'truck_owner', 'company', 'admin', 'employee'],
      default: 'general'
    },
    associatedTrucks: [mongoose.Schema.Types.ObjectId],
    truckOwnerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'TruckOwner', 
      default: null 
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      validate: {
        validator: async function(value) {
          try {
            // Validate companyId if the role is 'company'
            if (this.role === 'company' && !value) return false;
            return !value || await Company.exists({ _id: value });
          } catch (err) {
            return false; // Return false instead of throwing an error
          }
        },
        message: 'Invalid companyId or company does not exist.'
      }
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true
    },

    // Reset Password
    resetCode: { 
      type: String, 
      default: null 
    },
    resetCodeExpires: { 
      type: Date, 
      default: null 
    }
  },
  { 
    timestamps: { createdAt: true, updatedAt: true } 
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true });
UserSchema.index({ role: 1 });

// Hash the password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to generate a reset code
UserSchema.methods.generateResetCode = function() {
  const resetCode = uuidv4();
  this.resetCode = resetCode;
  this.resetCodeExpires = Date.now() + 3600000; // Reset code expires in 1 hour
  return resetCode;
};

// Method to get the country flag for the phone number
UserSchema.methods.getCountryFlag = function() {
  try {
    const phoneNumber = parsePhoneNumberWithError(this.phone, 'AE'); // Default to 'UAE' if no country code is provided
    const countryCallingCode = phoneNumber.countryCallingCode;
    return countryCallingCode;
  } catch (err) {
    console.error('Error parsing phone number:', err);
    return null; // Return null if the phone number is invalid
  }
};

// Create User model
const User = mongoose.model('User', UserSchema);
module.exports = User;