
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const JobCard = require('../models/JobCard');
const logger = require('../config/logger');

class PaymentService {
    /**
     * PROCESS CREDIT CARD PAYMENT
     * Handles Stripe payment processing with comprehensive error handling
     */
    static async processCardPayment(paymentData) {
        const { amount, currency = 'aed', cardToken, jobCardId, customerId, metadata } = paymentData;
        
        try {
            // Create Stripe payment intent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Stripe expects cents
                currency: currency.toLowerCase(),
                payment_method: cardToken,
                confirm: true,
                metadata: {
                    jobCardId,
                    customerId,
                    ...metadata
                }
            });

            // Create payment record in database
            const payment = new Payment({
                jobCardId,
                customerId,
                amount: amount,
                grandTotal: amount,
                currency: currency.toUpperCase(),
                paymentMethod: 'credit_card',
                paymentStatus: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
                gatewayResponse: {
                    gatewayTransactionId: paymentIntent.id,
                    gatewayName: 'stripe',
                    responseCode: paymentIntent.status,
                    responseMessage: paymentIntent.status === 'succeeded' ? 'Payment successful' : 'Payment pending'
                },
                metadata: {
                    ipAddress: metadata?.ipAddress,
                    userAgent: metadata?.userAgent
                }
            });

            await payment.save();

            // Update job card status if payment successful
            if (paymentIntent.status === 'succeeded') {
                await JobCard.findByIdAndUpdate(jobCardId, {
                    paymentStatus: 'paid',
                    paidAt: new Date()
                });
            }

            logger.info('Card payment processed', {
                transactionId: payment.transactionId,
                amount,
                status: payment.paymentStatus
            });

            return {
                success: true,
                payment,
                gatewayResponse: paymentIntent
            };

        } catch (error) {
            logger.error('Card payment failed', {
                error: error.message,
                jobCardId,
                amount
            });

            // Create failed payment record
            const failedPayment = new Payment({
                jobCardId,
                customerId,
                amount,
                grandTotal: amount,
                currency: currency.toUpperCase(),
                paymentMethod: 'credit_card',
                paymentStatus: 'failed',
                notes: error.message
            });

            await failedPayment.save();

            throw new Error(`Payment failed: ${error.message}`);
        }
    }

    /**
     * PROCESS CASH PAYMENT
     * Handles cash payments for in-person transactions
     */
    static async processCashPayment(paymentData) {
        const { amount, jobCardId, customerId, receivedBy } = paymentData;

        try {
            const payment = new Payment({
                jobCardId,
                customerId,
                amount,
                grandTotal: amount,
                currency: 'AED',
                paymentMethod: 'cash',
                paymentStatus: 'completed',
                processedAt: new Date(),
                notes: `Cash payment received by: ${receivedBy}`
            });

            await payment.save();

            // Update job card
            await JobCard.findByIdAndUpdate(jobCardId, {
                paymentStatus: 'paid',
                paidAt: new Date()
            });

            logger.info('Cash payment recorded', {
                transactionId: payment.transactionId,
                amount,
                receivedBy
            });

            return {
                success: true,
                payment
            };

        } catch (error) {
            logger.error('Cash payment recording failed', {
                error: error.message,
                jobCardId,
                amount
            });
            throw error;
        }
    }

    /**
     * PROCESS REFUND
     * Handles payment refunds through Stripe and updates records
     */
    static async processRefund(paymentId, refundAmount, reason) {
        try {
            const payment = await Payment.findById(paymentId);
            
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (!payment.canRefund) {
                throw new Error('Payment cannot be refunded');
            }

            const refundAmountFinal = refundAmount || payment.grandTotal;

            // Process refund through Stripe if it's a card payment
            if (payment.paymentMethod === 'credit_card' && payment.gatewayResponse?.gatewayTransactionId) {
                const refund = await stripe.refunds.create({
                    payment_intent: payment.gatewayResponse.gatewayTransactionId,
                    amount: Math.round(refundAmountFinal * 100), // Convert to cents
                    reason: 'requested_by_customer'
                });

                payment.gatewayResponse.refundId = refund.id;
            }

            // Update payment record
            await payment.processRefund(refundAmountFinal);
            payment.notes = reason || 'Refund processed';
            await payment.save();

            // Update job card
            await JobCard.findByIdAndUpdate(payment.jobCardId, {
                paymentStatus: 'refunded'
            });

            logger.info('Refund processed', {
                paymentId,
                refundAmount: refundAmountFinal,
                reason
            });

            return {
                success: true,
                refund: payment
            };

        } catch (error) {
            logger.error('Refund processing failed', {
                error: error.message,
                paymentId
            });
            throw error;
        }
    }

    /**
     * GET PAYMENT ANALYTICS
     * Generates comprehensive payment analytics and insights
     */
    static async getPaymentAnalytics(timeframe = 'month') {
        try {
            const now = new Date();
            let startDate;

            // Calculate date range based on timeframe
            switch (timeframe) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            const analytics = await Payment.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $facet: {
                        // Revenue analytics
                        revenue: [
                            {
                                $match: { paymentStatus: 'completed' }
                            },
                            {
                                $group: {
                                    _id: null,
                                    totalRevenue: { $sum: '$grandTotal' },
                                    completedTransactions: { $sum: 1 },
                                    avgTransactionValue: { $avg: '$grandTotal' }
                                }
                            }
                        ],
                        
                        // Payment method breakdown
                        paymentMethods: [
                            {
                                $group: {
                                    _id: '$paymentMethod',
                                    count: { $sum: 1 },
                                    revenue: { $sum: '$grandTotal' }
                                }
                            }
                        ],
                        
                        // Status breakdown
                        statusBreakdown: [
                            {
                                $group: {
                                    _id: '$paymentStatus',
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        
                        // Daily trend
                        dailyTrend: [
                            {
                                $group: {
                                    _id: {
                                        year: { $year: '$createdAt' },
                                        month: { $month: '$createdAt' },
                                        day: { $dayOfMonth: '$createdAt' }
                                    },
                                    revenue: { $sum: '$grandTotal' },
                                    transactions: { $sum: 1 }
                                }
                            },
                            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
                        ]
                    }
                }
            ]);

            return {
                success: true,
                timeframe,
                analytics: analytics[0]
            };

        } catch (error) {
            logger.error('Payment analytics generation failed', {
                error: error.message,
                timeframe
            });
            throw error;
        }
    }

    /**
     * VALIDATE PAYMENT DATA
     * Validates payment data before processing
     */
    static validatePaymentData(paymentData) {
        const { amount, paymentMethod, jobCardId, customerId } = paymentData;
        
        const errors = [];

        if (!amount || amount <= 0) {
            errors.push('Valid amount is required');
        }

        if (!paymentMethod) {
            errors.push('Payment method is required');
        }

        if (!jobCardId) {
            errors.push('Job card ID is required');
        }

        if (!customerId) {
            errors.push('Customer ID is required');
        }

        if (paymentMethod === 'credit_card' && !paymentData.cardToken) {
            errors.push('Card token is required for credit card payments');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = PaymentService;
