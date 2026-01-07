# Stripe Integration (Checkout) - Non-Profit-Blue-Print

This branch adds a minimal Stripe Checkout integration (server + front-end placeholders).

Files added:
- public/index.html (updated front-end calling the backend)
- server.js (Express server with /create-checkout-session and /webhook endpoints)
- package.json
- .env.example
- .gitignore

Setup
1. Checkout the branch:
   git fetch origin
   git checkout -b stripe-integration origin/stripe-integration || git checkout --track origin/stripe-integration || git checkout stripe-integration

2. Copy .env.example to .env and fill in your values (do NOT commit .env):
   cp .env.example .env
   - STRIPE_SECRET_KEY (sk_...)
   - STRIPE_PUBLISHABLE_KEY (pk_...)
   - STRIPE_WEBHOOK_SECRET (whsec_...)
   - PRICE_29_ID, PRICE_99_ID, PRICE_299_ID (from Stripe Dashboard)

3. Install and run:
   npm install
   npm start

4. Webhook testing
- Recommended: Stripe CLI
  stripe login
  stripe listen --forward-to localhost:8000/webhook
  Copy the printed webhook signing secret into .env as STRIPE_WEBHOOK_SECRET

- Or use ngrok:
  ngrok http 8000
  Add the ngrok URL + /webhook as a webhook endpoint in Stripe Dashboard and copy the signing secret into .env

5. Test Checkout
- Open http://localhost:8000 or your Codespace preview URL and click a Subscribe button. Use Stripe test card 4242 4242 4242 4242.

Security notes
- Never commit secret keys or webhook secrets to the repo.
- Use HTTPS in production and replace test keys with live keys when ready.


Please run the commands in your Codespace or local machine to start the server and test. If you want, I can also update the success/cancel URLs or wire actual Price IDs if you provide them (do not share secret keys).
