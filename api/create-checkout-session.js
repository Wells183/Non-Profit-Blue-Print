// Vercel serverless function to create Stripe Checkout sessions
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
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

    // Validate amount is a positive number
    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number' });
      return;
    }

    // Validate mode
    if (mode !== 'subscription' && mode !== 'payment') {
      res.status(400).json({ error: 'Mode must be either "subscription" or "payment"' });
      return;
    }

    // Get the domain for success/cancel URLs
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const domain = process.env.DOMAIN || `${protocol}://${host}`;

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
            unit_amount: amount,
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
            unit_amount: amount,
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
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
};
