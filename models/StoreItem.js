
const mongoose = require('mongoose');
const { Schema } = mongoose;

const StoreItemSchema = new Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    
    // Pricing
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Original price cannot be negative']
    },
    discount: {
        type: Number,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%'],
        default: 0
    },
    
    // Inventory
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    lowStockThreshold: {
        type: Number,
        default: 10
    },
    
    // Classification
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Engine Parts',
            'Brake System',
            'Transmission',
            'Electrical',
            'Body Parts',
            'Filters',
            'Fluids',
            'Tools',
            'Accessories',
            'Other'
        ]
    },
    subcategory: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    
    // Media
    imageUrl: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
            },
            message: 'Please provide a valid image URL'
        }
    },
    images: [{
        type: String,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
            },
            message: 'Please provide a valid image URL'
        }
    }],
    
    // Technical Details
    specifications: {
        brand: { type: String, trim: true },
        model: { type: String, trim: true },
        partNumber: { type: String, trim: true, unique: true, sparse: true },
        compatibility: [{ type: String, trim: true }],
        dimensions: {
            length: { type: Number, min: 0 },
            width: { type: Number, min: 0 },
            height: { type: Number, min: 0 },
            weight: { type: Number, min: 0 }
        },
        material: { type: String, trim: true },
        warranty: { type: String, trim: true }
    },
    
    // Status & Availability
    status: {
        type: String,
        enum: ['active', 'inactive', 'discontinued'],
        default: 'active'
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    
    // Analytics & Tracking
    views: {
        type: Number,
        default: 0
    },
    salesCount: {
        type: Number,
        default: 0
    },
    rating: {
        average: { type: Number, min: 0, max: 5, default: 0 },
        count: { type: Number, default: 0 }
    },
    
    // Metadata
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUpdatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for performance
StoreItemSchema.index({ category: 1 });
StoreItemSchema.index({ price: 1 });
StoreItemSchema.index({ name: 'text', description: 'text', tags: 'text' });
StoreItemSchema.index({ status: 1, isAvailable: 1 });
StoreItemSchema.index({ views: -1 });
StoreItemSchema.index({ salesCount: -1 });

// Virtual for discount price
StoreItemSchema.virtual('discountedPrice').get(function() {
    if (this.discount > 0 && this.originalPrice) {
        return this.originalPrice * (1 - this.discount / 100);
    }
    return this.price;
});

// Virtual for stock status
StoreItemSchema.virtual('stockStatus').get(function() {
    if (this.stock === 0) return 'out-of-stock';
    if (this.stock <= this.lowStockThreshold) return 'low-stock';
    return 'in-stock';
});

// Pre-save middleware
StoreItemSchema.pre('save', function(next) {
    // Auto-set availability based on stock
    this.isAvailable = this.stock > 0 && this.status === 'active';
    
    // Set original price if not provided
    if (!this.originalPrice) {
        this.originalPrice = this.price;
    }
    
    next();
});

// Static methods
StoreItemSchema.statics.findByCategory = function(category) {
    return this.find({ category, status: 'active', isAvailable: true });
};

StoreItemSchema.statics.findLowStock = function(threshold = 10) {
    return this.find({ stock: { $lte: threshold }, status: 'active' });
};

StoreItemSchema.statics.findTrending = function(limit = 10) {
    return this.find({ status: 'active' })
        .sort({ views: -1, salesCount: -1 })
        .limit(limit);
};

// Instance methods
StoreItemSchema.methods.updateStock = function(quantity) {
    this.stock += quantity;
    this.isAvailable = this.stock > 0;
    return this.save();
};

StoreItemSchema.methods.recordSale = function(quantity = 1) {
    this.stock -= quantity;
    this.salesCount += quantity;
    this.isAvailable = this.stock > 0;
    return this.save();
};

const StoreItem = mongoose.model('StoreItem', StoreItemSchema);
module.exports = StoreItem;
