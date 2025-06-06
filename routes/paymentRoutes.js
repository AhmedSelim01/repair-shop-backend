const express = require('express');
const { processPayment } = require('../services/paymentService');
const router = express.Router();

router.post('/process-payment', async (req, res) => {
    const { amount, currency, email, jobCardId } = req.body;

    if (!amount || !currency || !email || !jobCardId) {
        return res.status(400).json({ success: false, message: 'Amount, currency, email, and jobCardId are required.' });
    }

    try {
        const paymentIntent = await processPayment(amount, currency, email, jobCardId);
        res.status(200).json({ success: true, paymentIntent });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;