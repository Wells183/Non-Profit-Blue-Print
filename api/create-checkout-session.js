// Vercel serverless function to create Stripe Checkout sessions
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Enable CORS with origin validation
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // In production, require explicit origin whitelist
  // In development, allow localhost origins only when no origins configured
  if (origin) {
    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!isProduction && allowedOrigins.length === 0) {
      // Strict localhost validation: only allow exact localhost or localhost with port
      const localhostPattern = /^http:\/\/localhost(:\d+)?$/;
      if (localhostPattern.test(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    }
  }
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amount, mode, email } = req.body;

    // Validate required fields
    if (!amount || !mode) {
      res.status(400).json({ error: 'Missing required fields: amount and mode' });
      return;
    }

    // Validate and parse amount
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !Number.isInteger(parsedAmount)) {
      res.status(400).json({ error: 'Amount must be a positive integer (cents)' });
      return;
    }

    // Validate mode
    if (mode !== 'subscription' && mode !== 'payment') {
      res.status(400).json({ error: 'Mode must be either "subscription" or "payment"' });
      return;
    }

    // Get the domain for success/cancel URLs
    // In production, require DOMAIN to be explicitly set to prevent host header injection
    let domain = process.env.DOMAIN;
    
    if (!domain) {
      if (isProduction) {
        res.status(500).json({ error: 'Server configuration error' });
        console.error('DOMAIN environment variable must be set in production');
        return;
      }
      // In development, fallback to localhost with strict validation
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      // Only allow exact localhost or localhost with port
      if (host && /^localhost(:\d+)?$/.test(host)) {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        domain = `${protocol}://${host}`;
      } else {
        domain = 'http://localhost:3000';
      }
    }

    // Create session parameters based on mode
    const sessionParams = {
      mode: mode,
      success_url: `${domain}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/cancel.html`,
    };

    // Add customer email if provided
    if (email) {
      sessionParams.customer_email = email;
    }

    // Configure line items based on mode
    if (mode === 'subscription') {
      sessionParams.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Brandy Wells AI Research Hub Subscription',
              description: 'Monthly subscription to AI Research Hub',
            },
            unit_amount: parsedAmount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ];
    } else if (mode === 'payment') {
      sessionParams.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Brandy Wells AI Research Hub',
              description: 'One-time payment',
            },
            unit_amount: parsedAmount,
          },
          quantity: 1,
        },
      ];
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Return the session URL
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Return generic error message to client, log details server-side
    res.status(500).json({ 
      error: 'Failed to create checkout session. Please try again.'
    });
  }
};
