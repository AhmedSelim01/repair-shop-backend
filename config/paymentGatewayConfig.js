
/**
 * PAYMENT GATEWAY CONFIGURATION
 * Centralized configuration for multiple payment providers
 */

const stripe = require('stripe');

class PaymentGatewayConfig {
    constructor() {
        this.gateways = {
            stripe: {
                enabled: !!process.env.STRIPE_SECRET_KEY,
                client: process.env.STRIPE_SECRET_KEY ? stripe(process.env.STRIPE_SECRET_KEY) : null,
                supportedCurrencies: ['AED', 'USD', 'EUR'],
                supportedMethods: ['credit_card', 'debit_card'],
                webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
            }
        };
    }

    // Get active payment gateway
    getGateway(name = 'stripe') {
        const gateway = this.gateways[name];
        if (!gateway || !gateway.enabled) {
            throw new Error(`Payment gateway ${name} is not configured or enabled`);
        }
        return gateway;
    }

    // Validate payment method for gateway
    validatePaymentMethod(gateway, method) {
        const config = this.gateways[gateway];
        return config && config.supportedMethods.includes(method);
    }

    // Validate currency for gateway
    validateCurrency(gateway, currency) {
        const config = this.gateways[gateway];
        return config && config.supportedCurrencies.includes(currency.toUpperCase());
    }

    // Get all enabled gateways
    getEnabledGateways() {
        return Object.keys(this.gateways).filter(key => this.gateways[key].enabled);
    }
}

module.exports = new PaymentGatewayConfig();
