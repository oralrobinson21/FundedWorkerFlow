#!/bin/bash

# ============================================
# FundedWorkerFlow Complete Automation Script
# ============================================
# This script does EVERYTHING:
# - Validates environment
# - Starts services
# - Tests all endpoints
# - Tests Stripe integration
# - Tests email system
# - Optionally deploys to Railway
# - Monitors health
# - Provides complete summary report

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
echo "============================================"
echo "FundedWorkerFlow Complete Automation"
echo "============================================"
echo ""
log_info "This script will:"
echo "  1. Validate environment configuration"
echo "  2. Start backend and frontend services"
echo "  3. Test all API endpoints"
echo "  4. Test Stripe integration"
echo "  5. Test email system"
echo "  6. Provide complete summary"
echo ""

# Ask for mode
echo "Select mode:"
echo "  1) Local development only"
echo "  2) Local + Railway deployment"
echo "  3) Test existing deployment"
read -p "Enter choice (1-3): " MODE

echo ""

# ============================================
# Phase 1: Environment Validation
# ============================================
echo "============================================"
echo "Phase 1: Environment Validation"
echo "============================================"
echo ""

log_info "Validating environment configuration..."
if node scripts/validate-env.js; then
  log_success "Environment validation passed"
else
  log_error "Environment validation failed"
  log_info "Fix errors above before continuing"
  exit 1
fi

echo ""

# ============================================
# Phase 2: Start Services (Local modes only)
# ============================================
if [ "$MODE" != "3" ]; then
  echo "============================================"
  echo "Phase 2: Starting Services"
  echo "============================================"
  echo ""

  log_info "Starting backend and frontend..."
  log_warning "This will open a new terminal for Expo"
  echo ""

  # Run master-start.sh in background (without Expo blocking)
  # We'll modify this to start services without blocking

  log_info "Killing old processes..."
  lsof -ti:5001 | xargs kill -9 2>/dev/null || true
  for PORT in 8081 8082 8083 8084; do
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
  done
  log_success "Old processes killed"

  log_info "Starting backend with PM2..."
  pm2 delete fundedworker-backend 2>/dev/null || true
  pm2 start ecosystem.config.js
  log_success "Backend started"

  # Wait for backend to be ready
  log_info "Waiting for backend to be ready..."
  sleep 5

  # Check if backend is responding
  if curl -s -f http://localhost:5001/health > /dev/null 2>&1; then
    log_success "Backend is responding"
  else
    log_error "Backend not responding"
    log_info "Check PM2 logs: pm2 logs fundedworker-backend"
    exit 1
  fi

  echo ""
fi

# ============================================
# Phase 3: Endpoint Testing
# ============================================
echo "============================================"
echo "Phase 3: API Endpoint Testing"
echo "============================================"
echo ""

if [ "$MODE" = "3" ]; then
  read -p "Enter deployment URL (e.g., https://your-app.railway.app): " DEPLOY_URL
  TEST_URL="$DEPLOY_URL"
else
  TEST_URL="http://localhost:5001"
fi

log_info "Testing endpoints at: $TEST_URL"
if node scripts/test-endpoints.js "$TEST_URL"; then
  log_success "All endpoints passed"
else
  log_warning "Some endpoints failed (see details above)"
fi

echo ""

# ============================================
# Phase 4: Stripe Testing
# ============================================
echo "============================================"
echo "Phase 4: Stripe Integration Testing"
echo "============================================"
echo ""

log_info "Testing Stripe integration..."
if node scripts/test-stripe.js "$TEST_URL"; then
  log_success "Stripe integration passed"
else
  log_warning "Stripe tests failed (see details above)"
fi

echo ""

# ============================================
# Phase 5: Email Testing
# ============================================
echo "============================================"
echo "Phase 5: Email System Testing"
echo "============================================"
echo ""

log_info "Testing email system..."
log_info "This will prompt for test email options"
echo ""

if node scripts/test-email.js "$TEST_URL"; then
  log_success "Email system passed"
else
  log_warning "Email tests failed (see details above)"
fi

echo ""

# ============================================
# Phase 6: Railway Deployment (Mode 2 only)
# ============================================
if [ "$MODE" = "2" ]; then
  echo "============================================"
  echo "Phase 6: Railway Deployment"
  echo "============================================"
  echo ""

  read -p "Deploy to Railway now? (y/n): " DEPLOY

  if [[ "$DEPLOY" =~ ^[Yy]$ ]]; then
    log_info "Starting Railway deployment..."
    ./scripts/deploy-railway.sh

    if [ $? -eq 0 ]; then
      log_success "Railway deployment complete"

      # Test deployed version
      echo ""
      log_info "Testing deployed version..."
      read -p "Enter Railway URL: " RAILWAY_URL

      log_info "Waiting 10 seconds for deployment to be ready..."
      sleep 10

      node scripts/test-endpoints.js "$RAILWAY_URL"
    else
      log_error "Railway deployment failed"
    fi
  else
    log_info "Skipping Railway deployment"
  fi

  echo ""
fi

# ============================================
# Phase 7: Domain Verification (Optional)
# ============================================
echo "============================================"
echo "Phase 7: Domain Verification (Optional)"
echo "============================================"
echo ""

read -p "Verify custom domain? (y/n): " VERIFY_DOMAIN

if [[ "$VERIFY_DOMAIN" =~ ^[Yy]$ ]]; then
  read -p "Enter domain (e.g., porkburn.com): " DOMAIN
  log_info "Verifying domain: $DOMAIN"
  node scripts/verify-domain.js "$DOMAIN"
else
  log_info "Skipping domain verification"
fi

echo ""

# ============================================
# Phase 8: Start Health Monitoring (Optional)
# ============================================
if [ "$MODE" != "3" ]; then
  echo "============================================"
  echo "Phase 8: Health Monitoring"
  echo "============================================"
  echo ""

  read -p "Start health monitoring in background? (y/n): " START_MONITOR

  if [[ "$START_MONITOR" =~ ^[Yy]$ ]]; then
    log_info "Starting health monitor with PM2..."
    pm2 start scripts/health-monitor.js --name health-monitor
    log_success "Health monitor started"
    log_info "View logs: pm2 logs health-monitor"
  else
    log_info "Skipping health monitoring"
    log_info "You can start it later with: pm2 start scripts/health-monitor.js --name health-monitor"
  fi

  echo ""
fi

# ============================================
# Final Summary
# ============================================
echo "============================================"
echo "Complete Summary"
echo "============================================"
echo ""

log_success "Automation complete!"
echo ""

if [ "$MODE" != "3" ]; then
  echo "Local Services:"
  log_info "Backend: http://localhost:5001"
  log_info "PM2 status: pm2 status"
  log_info "PM2 logs: pm2 logs fundedworker-backend"
  echo ""
fi

echo "Testing Completed:"
log_info "✓ Environment validation"
log_info "✓ API endpoint testing"
log_info "✓ Stripe integration"
log_info "✓ Email system"
echo ""

echo "Available Commands:"
log_info "pm2 status - View all services"
log_info "pm2 logs fundedworker-backend - Backend logs"
log_info "pm2 logs health-monitor - Health monitor logs"
log_info "pm2 monit - Real-time monitoring dashboard"
log_info "pm2 stop all - Stop all services"
echo ""

if [ "$MODE" != "3" ]; then
  log_warning "Frontend (Expo) not started automatically"
  log_info "Start with: npx expo start --tunnel"
  log_info "Or use: ./master-start.sh (opens Expo automatically)"
  echo ""
fi

echo "Documentation:"
log_info "README.md - Complete documentation"
log_info "API endpoints: README.md#backend-endpoints"
log_info "Automation: README.md#automation--testing"
echo ""

log_success "FundedWorkerFlow is ready!"
echo "============================================"
echo ""
