const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    jobCardId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'JobCard', 
        required: true 
    },
    paymentDate: { 
        type: Date, 
        default: Date.now,
    },
    partsCost: { 
        type: Number, 
        default: 0, 
        min: 0,
    },
    serviceFee: { 
        type: Number, 
        default: 0, 
        min: 0,
    },
    vat: { 
        type: Number, 
        default: 0, 
        min: 0,
    },
    grandTotal: { 
        type: Number, 
        default: 0, 
        min: 0,
    },
    paymentStatus: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'], 
        default: 'pending', 
    },
    paymentMethod: { 
        type: String, 
        enum: ['cash', 'credit', 'online'], 
        default: 'cash',
    },
    paymentReference: {
        type: String, 
        trim: true 
    },
}, {
    timestamps: true,
});

PaymentSchema.pre('save', async function (next) {
    const subtotal = this.partsCost + this.serviceFee;
    this.vat = subtotal * 0.05; // 5% VAT
    this.grandTotal = subtotal + this.vat;

    // Check if grand total is greater than 0 for completed payment
    if (this.grandTotal === 0 && this.paymentStatus === 'completed') {
        return next(new Error('Grand total must be greater than 0 for a completed payment.'));
    }

    // Set paymentDate to current date if paymentStatus is completed and not already set
    if (this.paymentStatus === 'completed' && !this.paymentDate) {
        this.paymentDate = new Date();
    }

    next();
});

const Payment = mongoose.model('Payment', PaymentSchema);
module.exports = Payment;