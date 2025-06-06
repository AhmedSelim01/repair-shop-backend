const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
require('dotenv').config();
const pdf = require('pdfkit');
const fs = require('fs');
const Payment = require('../models/Payment');

const sendEmail = async ({ to, subject, attachments }) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Replace with your email provider
        auth: {
            user: process.env.EMAIL_USER, // Add this to your .env file
            pass: process.env.EMAIL_PASS, // Add this to your .env file
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        attachments,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email not sent');
    }
};

const createInvoice = (paymentIntent) => {
    const doc = new pdf();
    doc.text(`Invoice for Payment ID: ${paymentIntent.id}`, 100, 100);
    doc.text(`Amount: $${paymentIntent.amount / 100}`, 100, 150);
    doc.text(`Status: ${paymentIntent.status}`, 100, 200);
    const invoicePath = `./invoices/invoice_${paymentIntent.id}.pdf`;
    doc.pipe(fs.createWriteStream(invoicePath));
    doc.end();
    return invoicePath;
};

const processPayment = async (amount, currency, email, jobCardId) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
        });

        const invoicePath = createInvoice(paymentIntent);

        await sendEmail({
            to: email,
            subject: 'Your Invoice',
            attachments: [
                {
                    filename: `invoice_${paymentIntent.id}.pdf`,
                    path: invoicePath,
                },
            ],
        });

        // Create a new Payment record
        const payment = new Payment({
            jobCardId,
            partsCost: amount / 100, // Assuming amount is in cents
            paymentStatus: 'completed',
            paymentMethod: 'online',
            paymentReference: paymentIntent.id,
        });

        await payment.save();

        return paymentIntent;
    } catch (error) {
        console.error('Error processing payment:', error);
        throw new Error('Payment processing failed');
    }
};

module.exports = {
    processPayment,
};