const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StoreItem',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
    }],
    status: {
        type: String,
        enum: ['active', 'checked-out', 'cancelled'],
        default: 'active',
    },
    totalPrice: {
        type: Number,
        default: 0,
        min: 0,
    },
}, {
    timestamps: true,
});

CartSchema.pre('save', function (next) {
    let total = 0;
    this.items.forEach(item => {
        total += item.totalPrice;
    });
    this.totalPrice = total;
    next();
});

// Example method: Finds the active cart for a user
Cart.getActiveCart = async (userId) => {
    return await Cart.findOne({ userId, status: 'active' });
};

// Example method: Checkout and update the cart's status
Cart.checkoutCart = async function () {
    this.status = 'checked-out';
    await this.save();
    return this;
};


const Cart = mongoose.model('Cart', CartSchema);
module.exports = Cart;
