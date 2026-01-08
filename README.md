# Non-Profit-Blue-Print

## Brandy Wells AI Research Hub - Stripe Checkout Integration

This repository contains a Stripe Checkout integration for the Brandy Wells AI Research Hub with subscription support, built using Vercel serverless functions.

## Features

- **Subscription Plans**: Three tiers ($29, $99, $299/month)
- **Secure Payments**: Powered by Stripe Checkout
- **Serverless Architecture**: Vercel serverless functions for scalability
- **Email Collection**: Captures customer email during checkout
- **Success/Cancel Pages**: Professional post-checkout experience
- **Environment-Based Configuration**: Easy deployment across environments

## Project Structure

```
.
├── signup/
│   └── index.html              # Landing page with subscription plans
├── api/
│   └── create-checkout-session.js  # Vercel serverless function
├── success.html                # Success redirect page
├── cancel.html                 # Cancel redirect page
├── package.json                # Node.js dependencies
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## Local Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Stripe account (use test mode for development)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Wells183/Non-Profit-Blue-Print.git
   cd Non-Profit-Blue-Print
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Add your Stripe keys**
   
   Get your test API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys):
   - Click on "Developers" → "API keys"
   - Copy your "Secret key" (starts with `sk_test_`)
   - Copy your "Publishable key" (starts with `pk_test_`)
   
   Edit `.env` and add your keys:
   ```
   STRIPE_SECRET_KEY=sk_test_your_actual_test_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
   DOMAIN=http://localhost:3000
   ```

   **⚠️ IMPORTANT**: Never commit your `.env` file or expose your secret keys!

5. **Install Vercel CLI (optional but recommended)**
   ```bash
   npm install -g vercel
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Or with Vercel CLI:
   ```bash
   vercel dev
   ```

7. **Open your browser**
   
   Navigate to `http://localhost:3000/signup/` to see the subscription page.

## Testing Payments

Stripe provides test card numbers for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiration date, any 3-digit CVC, and any postal code.

For more test cards, visit [Stripe Testing Documentation](https://stripe.com/docs/testing).

### Testing the Checkout Flow

1. Go to `http://localhost:3000/signup/`
2. Enter your email address
3. Click "Subscribe Now" on any plan
4. You'll be redirected to Stripe Checkout (test mode)
5. Use test card `4242 4242 4242 4242` with any future date and CVC
6. Complete the payment
7. You'll be redirected to the success page

## Deployment to Vercel

### First-Time Deployment

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy the project**
   ```bash
   vercel
   ```
   
   Follow the prompts to link or create a new project.

4. **Set environment variables in Vercel**
   
   Option A - Via CLI:
   ```bash
   vercel env add STRIPE_SECRET_KEY
   vercel env add STRIPE_PUBLISHABLE_KEY
   vercel env add DOMAIN
   ```
   
   Option B - Via Dashboard:
   - Go to your project in the [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to Settings → Environment Variables
   - Add the following variables:
     - `STRIPE_SECRET_KEY`: Your Stripe secret key
     - `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
     - `DOMAIN`: Your deployment URL (e.g., `https://your-app.vercel.app`)

5. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Updating Environment Variables

After adding or changing environment variables, redeploy:
```bash
vercel --prod
```

## API Endpoint

### POST /api/create-checkout-session

Creates a Stripe Checkout session.

**Request Body:**
```json
{
  "amount": 2900,
  "mode": "subscription",
  "email": "customer@example.com"
}
```

**Parameters:**
- `amount` (number, required): Amount in cents (e.g., 2900 = $29.00)
- `mode` (string, required): Either "subscription" or "payment"
- `email` (string, optional): Customer email address

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

## Webhooks (Recommended for Production)

For production use, it's highly recommended to implement webhook handlers to:
- Confirm successful payments
- Handle subscription lifecycle events (renewals, cancellations, etc.)
- Update your database with payment status

To set up webhooks:

1. Create a webhook endpoint in your Vercel project (e.g., `/api/webhook`)
2. Add the webhook URL in your [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
3. Listen for events like:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

Example webhook structure:
```javascript
// api/webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        break;
      // ... other event types
    }
    
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
```

## Switching to Live Mode

When you're ready to accept real payments:

1. **Get your live API keys** from the Stripe Dashboard
   - Switch from "Test mode" to "Live mode" in the dashboard
   - Copy your live keys (they start with `sk_live_` and `pk_live_`)

2. **Update environment variables in Vercel**
   - Replace test keys with live keys
   - Ensure `DOMAIN` points to your production URL

3. **Test thoroughly** in live mode with small amounts before going fully live

4. **Enable webhooks** for production (highly recommended)

## Security Notes

- ✅ Never commit `.env` files or secret keys to version control
- ✅ Always use environment variables for sensitive data
- ✅ Use test mode keys during development
- ✅ Validate all inputs in serverless functions
- ✅ Implement webhook signature verification for production
- ✅ Use HTTPS in production (Vercel provides this automatically)
- ✅ Keep your Stripe library updated

## Troubleshooting

### "No such API key" error
- Ensure your `STRIPE_SECRET_KEY` is set correctly in Vercel environment variables
- Verify you're using the correct key format (starts with `sk_test_` or `sk_live_`)
- Redeploy after adding environment variables

### Redirect issues
- Check that `DOMAIN` environment variable is set to your deployment URL
- Ensure success.html and cancel.html are in the root directory
- Verify URLs in the Vercel deployment logs

### CORS errors (local development)
- Use `vercel dev` instead of a simple HTTP server
- CORS headers are included in the serverless function

## Support

For issues or questions:
- Check the [Stripe Documentation](https://stripe.com/docs)
- Review [Vercel Documentation](https://vercel.com/docs)
- Contact support@brandywells-ai.com

## License

MIT