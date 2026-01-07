require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Create Checkout Session (subscription mode)
app.post('/create-checkout-session', async (req, res) => {
  const { priceId, customerEmail } = req.body;
  if (!priceId) return res.status(400).json({ error: 'Missing priceId' });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: `${process.env.BASE_URL}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/cancel`
    });
    res.json({ sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Webhook endpoint (verify signature)
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Checkout session completed:', session.id);
    // TODO: create user record or activate subscription in your DB
  } else if (event.type === 'invoice.payment_succeeded') {
    console.log('Invoice payment succeeded:', event.data.object.id);
  }

  res.json({ received: true });
});

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
