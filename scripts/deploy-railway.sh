#!/bin/bash

# Railway Deployment Automation Script
# Deploys FundedWorkerFlow to Railway with all configurations

set -e  # Exit on error

COLORS_GREEN='\033[0;32m'
COLORS_RED='\033[0;31m'
COLORS_YELLOW='\033[1;33m'
COLORS_BLUE='\033[0;34m'
COLORS_RESET='\033[0m'

log_success() {
  echo -e "${COLORS_GREEN}✓${COLORS_RESET} $1"
}

log_error() {
  echo -e "${COLORS_RED}✗${COLORS_RESET} $1"
}

log_warning() {
  echo -e "${COLORS_YELLOW}⚠${COLORS_RESET} $1"
}

log_info() {
  echo -e "${COLORS_BLUE}ℹ${COLORS_RESET} $1"
}

echo ""
echo "==========================================="
echo "Railway Deployment for FundedWorkerFlow"
echo "==========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
  log_error "Railway CLI not installed"
  log_info "Install with: npm install -g @railway/cli"
  exit 1
fi
log_success "Railway CLI found"

# Check if logged in
if ! railway whoami &> /dev/null; then
  log_warning "Not logged in to Railway"
  log_info "Logging in..."
  railway login
fi
log_success "Logged in to Railway"

# Check if backend/.env exists
if [ ! -f "./backend/.env" ]; then
  log_error "backend/.env not found"
  log_info "Copy backend/.env.example and add your API keys"
  exit 1
fi
log_success "backend/.env found"

# Validate environment variables
log_info "Validating environment variables..."
if ! node scripts/validate-env.js; then
  log_error "Environment validation failed"
  log_info "Fix errors above before deploying"
  exit 1
fi
log_success "Environment variables validated"

# Ask for confirmation
echo ""
log_warning "This will deploy to Railway. Make sure:"
echo "  1. You're using LIVE Stripe keys (not test keys)"
echo "  2. You have a Railway project created"
echo "  3. Your DATABASE_URL is accessible from Railway"
echo ""
read -p "Continue? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
  log_info "Deployment cancelled"
  exit 0
fi

# Initialize or link Railway project
if [ ! -f ".railway" ]; then
  log_info "No Railway project linked. Choose one or create new:"
  railway init
else
  log_success "Railway project already linked"
fi

echo ""
log_info "Setting environment variables on Railway..."

# Read backend/.env and set variables
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  [[ -z "$key" || "$key" =~ ^#.*  ]] && continue

  # Remove quotes from value if present
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')

  # Skip if value contains placeholder
  if [[ "$value" == *"XXXX"* ]]; then
    log_warning "Skipping $key (placeholder value)"
    continue
  fi

  log_info "Setting $key..."
  railway variables set "$key=$value" || log_warning "Failed to set $key"
done < backend/.env

log_success "Environment variables set"

# Deploy
echo ""
log_info "Deploying to Railway..."
railway up

log_success "Deployment complete!"

# Get domain
echo ""
log_info "Getting deployment URL..."
RAILWAY_DOMAIN=$(railway domain 2>/dev/null || echo "Not configured")

if [ "$RAILWAY_DOMAIN" != "Not configured" ]; then
  log_success "Deployment URL: https://$RAILWAY_DOMAIN"
  log_info "Update your Stripe webhook to: https://$RAILWAY_DOMAIN/api/stripe/webhook"
else
  log_warning "No domain configured. Add one in Railway dashboard."
fi

echo ""
log_info "Testing deployment..."
sleep 5  # Wait for deployment to be ready

if [ "$RAILWAY_DOMAIN" != "Not configured" ]; then
  if curl -s -f "https://$RAILWAY_DOMAIN/health" > /dev/null; then
    log_success "Backend is responding!"
  else
    log_warning "Backend not responding yet. Check Railway logs."
  fi
fi

echo ""
echo "==========================================="
log_success "Deployment process complete!"
echo "==========================================="
echo ""
log_info "Next steps:"
echo "  1. Check Railway dashboard for deployment status"
echo "  2. Configure custom domain (if needed)"
echo "  3. Update Stripe webhook URL"
echo "  4. Test API endpoints: node scripts/test-endpoints.js RAILWAY_URL"
echo ""
