const mongoose = require('mongoose');

const StoreItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
    image: {
        type: String, // URL to the image
        required: true,
    },
}, {
    timestamps: true,
});

StoreItemSchema.methods.updateStock = function (quantity) {
    if (this.stock >= quantity) {
        this.stock -= quantity;
        return this.save();
    } else {
        throw new Error('Insufficient stock');
    }
};

// Finds an item by name
StoreItem.findByName = async (name) => {
    return await StoreItem.findOne({ name: new RegExp(name, 'i') });
};

// Updates the stock when an item is bought
StoreItem.updateStock = async (itemId, quantity) => {
    const item = await StoreItem.findById(itemId);
    if (!item) throw new Error('Item not found');
    
    if (item.stock >= quantity) {
        item.stock -= quantity;
        await item.save();
        return item;
    } else {
        throw new Error('Not enough stock available');
    }
};

const StoreItem = mongoose.model('StoreItem', StoreItemSchema);
module.exports = StoreItem;
