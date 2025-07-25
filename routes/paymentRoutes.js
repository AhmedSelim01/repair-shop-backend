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
const express = require('express');
const {
    processPayment,
    getPaymentHistory,
    getPaymentById,
    refundPayment,
    getPaymentAnalytics,
    webhookHandler
} = require('../controllers/paymentController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - amount
 *         - paymentMethod
 *         - jobCardId
 *       properties:
 *         transactionId:
 *           type: string
 *           description: Unique transaction identifier
 *         amount:
 *           type: number
 *           description: Payment amount
 *         paymentMethod:
 *           type: string
 *           enum: [credit_card, debit_card, cash, bank_transfer, digital_wallet]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded, cancelled]
 */

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Process a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *               - jobCardId
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *               jobCardId:
 *                 type: string
 *               cardToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid payment data
 */
router.post('/process', authMiddleware, processPayment);

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 */
router.get('/history', authMiddleware, getPaymentHistory);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *       404:
 *         description: Payment not found
 */
router.get('/:id', authMiddleware, getPaymentById);

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Process payment refund
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Cannot process refund
 */
router.post('/:id/refund', authMiddleware, roleMiddleware(['admin', 'employee']), refundPayment);

/**
 * @swagger
 * /api/payments/analytics:
 *   get:
 *     summary: Get payment analytics
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *     responses:
 *       200:
 *         description: Payment analytics retrieved successfully
 */
router.get('/analytics', authMiddleware, roleMiddleware(['admin', 'employee']), getPaymentAnalytics);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Payment gateway webhook
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook', webhookHandler);

module.exports = router;
