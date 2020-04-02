if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const config = {
    databaseURL: process.env.DATABASE,
    mail: process.env.MAIL
    // publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    // clientSecret: paymentIntent.client_secret
};

module.exports = config;