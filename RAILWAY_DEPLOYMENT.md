# Railway Deployment Guide for CityTasks

## Quick Start

1. **Push to GitHub** - Connect your Replit project to GitHub or download and push manually
2. **Create Railway Project** - Go to railway.app → New Project → Deploy from GitHub
3. **Add PostgreSQL** - Click "Add Service" → "Database" → "PostgreSQL"
4. **Set Environment Variables** (see below)
5. **Deploy** - Railway will automatically build and deploy

---

## Environment Variables

Add these in Railway Dashboard → Your Project → Variables:

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Railway provides this automatically when you add PostgreSQL |
| `STRIPE_SECRET_KEY` | Your Stripe secret key | `sk_live_...` or `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key | `pk_live_...` or `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `SESSION_SECRET` | Random string for sessions | Any long random string |

### Automatic (Railway provides)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port - Railway sets this automatically, no action needed |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `MIN_JOB_PRICE_USD` | Minimum job price | `7` |
| `PLATFORM_FEE_PERCENT` | Platform fee percentage | `15` |
| `RESEND_API_KEY` | Resend API key for emails | None (emails won't send without this) |

---

## Build Process

Railway will automatically:

1. Run `npm install` to install dependencies
2. Run `npx expo export --platform web --output-dir web-dist` to build the web app
3. Start the server with `node backend/server.js`

The backend serves both:
- **API endpoints** at `/api/*`
- **Web app** (landing page, auth, etc.) at all other routes

---

## Stripe Webhook Setup

After deploying, set up your Stripe webhook:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your Railway URL: `https://your-app.railway.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
5. Copy the signing secret and add it as `STRIPE_WEBHOOK_SECRET` in Railway

---

## Custom Domain (citytask.app)

1. In Railway Dashboard → Your Project → Settings → Domains
2. Click "Add Custom Domain"
3. Enter `citytask.app`
4. Railway will provide DNS records to add to your domain registrar
5. Add the CNAME or A records to your DNS
6. Wait for DNS propagation (up to 48 hours)

---

## PostgreSQL Database

Railway provides PostgreSQL automatically:

1. Click "Add Service" → "Database" → "PostgreSQL"
2. Railway automatically adds `DATABASE_URL` to your environment
3. The app creates all tables automatically on first start

---

## Monitoring

- View logs in Railway Dashboard → Your Project → Deployments → View Logs
- The backend logs all API requests and errors
- Activity logs are stored in the database

---

## Troubleshooting

### App shows blank page
- Check if `web-dist` folder was created during build
- Look at build logs for Expo export errors

### API errors
- Check `DATABASE_URL` is set correctly
- Verify Stripe keys are correct (test vs live)

### Stripe payments not working
- Verify webhook secret is correct
- Check webhook is pointing to correct URL
- Ensure you're using matching test/live keys

### Emails not sending
- Add `RESEND_API_KEY` environment variable
- Verify domain is verified in Resend dashboard
