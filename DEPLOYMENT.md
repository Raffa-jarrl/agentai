# Deployment Guide: AgentAI to Production

## Prerequisites

- Supabase account (free tier OK for initial users)
- Anthropic API key ($5 credit/month)
- Vercel account (free tier OK)
- GitHub account (for CI/CD)

---

## Step 1: Supabase Setup (15 min)

### 1.1 Create Project
```bash
# Go to https://supabase.com and sign up
# Create new project:
# - Project name: "agentai-prod"
# - Database password: [strong 16-char password]
# - Region: [closest to your agencies]
# - Save project credentials
```

### 1.2 Push Schema
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push

# Verify
supabase db list  # Should show 8 tables + webhook_attempts
```

### 1.3 Configure Storage
```bash
# In Supabase dashboard → Storage:
# 1. Create bucket "listing-photos"
#    - Public (anyone can read)
#    - 50MB max file size
# 2. Create bucket "voice-notes"
#    - Private (auth only)
```

### 1.4 Copy Connection String
```bash
# From Supabase dashboard → Settings → Database:
# Copy the "URI" for Node.js
# Format: postgresql://postgres:<password>@<host>:5432/postgres
# Save for Vercel env vars
```

---

## Step 2: Anthropic Setup (5 min)

### 2.1 Get API Key
```bash
# Go to https://console.anthropic.com
# Sign up → Billing → Add payment method
# Dashboard → API Keys → Create Key
# Save key (shows only once)
```

### 2.2 Set Budget
```
# Go to Usage Limits
# Set soft limit: $100/month (emails you before)
# Set hard limit: $200/month (blocks API calls)
```

---

## Step 3: Vercel Deployment (10 min)

### 3.1 Push to GitHub
```bash
cd /Users/raffa/real\ estate
git remote add origin https://github.com/YOUR_USERNAME/agentai.git
git branch -M main
git push -u origin main
```

### 3.2 Deploy to Vercel
```bash
# Go to https://vercel.com
# Import project from GitHub
# Select repository: YOUR_USERNAME/agentai
# Framework: Next.js
# Build command: npm run build (default)
# Output directory: .next (default)
```

### 3.3 Set Environment Variables
```
In Vercel dashboard → Settings → Environment Variables, add:

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from Supabase]
SUPABASE_SERVICE_ROLE_KEY=[from Supabase Settings → API]
ANTHROPIC_API_KEY=[from Anthropic]
NEXT_PUBLIC_APP_URL=https://YOUR_VERCEL_DOMAIN.vercel.app
CRON_SECRET=[generate: openssl rand -hex 16]

Optional Phase 2:
UPSTASH_REDIS_URL=[when ready]
SENTRY_DSN=[when ready]
```

### 3.4 Trigger Deploy
```bash
# In Vercel dashboard, click "Deploy"
# Wait for build to complete (~3 min)
# Get domain: YOUR_PROJECT.vercel.app
```

---

## Step 4: Verify Deployment (5 min)

### 4.1 Health Check
```bash
# Check homepage
curl https://YOUR_DOMAIN.vercel.app
# Expected: 200 OK, redirects to /signup

# Check API
curl https://YOUR_DOMAIN.vercel.app/api/dashboard
# Expected: 401 (needs auth)
```

### 4.2 Test Auth Flow
```bash
# Open https://YOUR_DOMAIN.vercel.app/signup
# Fill in:
#   Full Name: Test Agent
#   Business: Test Real Estate
#   Phone: +1 (555) 123-4567
#   Email: test@example.com
#   Password: TestPassword123!
# Click Sign Up
# Expected: Redirected to /dashboard
```

### 4.3 Test AI Integration
```bash
# After login, go to /listings/new
# Fill in:
#   Title: Test Apartment
#   Type: Apartment
#   Price: 500000
#   City: Tel Aviv
#   Hint: Newly renovated, 3 bedrooms
# Click "צור תיאור עם AI"
# Expected: Description appears in 30 sec
```

---

## Step 5: Database Monitoring (5 min)

### 5.1 Set Up Alerts
```bash
# In Supabase dashboard → Monitoring:
# CPU > 80%: Alert
# Connections > 800/1000: Alert
# Storage > 40GB: Alert
```

### 5.2 Enable Backups
```bash
# In Supabase → Backups:
# Daily backup (automatic)
# Keep 7 days retention
```

---

## Step 6: Agency Onboarding (First Customer)

### 6.1 Create Agency Account
```bash
# Send link: https://YOUR_DOMAIN.vercel.app/signup
# Agency fills in details → Gets dashboard access
# Confirm via Supabase → auth.users table
```

### 6.2 Verify Setup Email (Future: Implement)
```
# TODO: Auto-send welcome email with:
# - Dashboard URL
# - First steps (add listing, add lead, generate content)
# - Support Slack channel
# - 14-day free trial coupon code
```

### 6.3 Run Onboarding Checklist
- [ ] Agent can sign up
- [ ] Agent can upload listing + photos
- [ ] Agent can add lead
- [ ] Agent can generate content (AI works)
- [ ] Agent sees dashboard metrics
- [ ] Agent can test WhatsApp webhook

---

## Step 7: Monitoring & Support

### 7.1 Daily Checks
```bash
# Monitor errors
# → Sentry dashboard (when enabled)

# Monitor usage
# → Supabase dashboard → Database → Query Performance
# → Vercel dashboard → Analytics

# Monitor AI costs
# → Anthropic dashboard → Usage
```

### 7.2 Weekly Checks
```bash
# DB size growth
# Backup integrity
# Agent activation rate
# Feature usage
```

---

## Step 8: Scale to 10+ Agencies

### 8.1 Enable Observability
```bash
# When: 10+ agencies
# Install Sentry
npm install @sentry/nextjs

# Create Sentry org → Add SENTRY_DSN to Vercel env
# Re-deploy
```

### 8.2 Enable Rate Limiting
```bash
# When: CPU/memory spikes
# Install Upstash
npm install @upstash/ratelimit @upstash/redis

# Create Upstash Redis at https://console.upstash.com
# Copy UPSTASH_REDIS_URL → Vercel env
# Re-deploy
```

### 8.3 Scale Database
```bash
# When: >1000 concurrent users
# In Supabase Settings:
# - Enable pgBouncer (connection pooling)
# - Set max_connections = 1000
# - Monitor pool status
```

---

## Troubleshooting

### "Can't upload photos"
→ Check Supabase Storage bucket exists and is public  
→ Verify `NEXT_PUBLIC_SUPABASE_URL` is correct

### "AI descriptions not generating"
→ Check `ANTHROPIC_API_KEY` is set  
→ Verify API key has billing enabled  
→ Check Anthropic dashboard for errors

### "Database connection timeout"
→ Increase `max_connections` in Supabase settings  
→ Enable pgBouncer (connection pooling)

### "WhatsApp webhook returns 500"
→ Check `SUPABASE_SERVICE_ROLE_KEY` is set  
→ Verify webhook payload format in curl request

---

## Cost Estimate (First Month)

| Service | Usage | Cost |
|---------|-------|------|
| Supabase | 2 agencies, 100 photos | Free tier |
| Anthropic | 100 AI calls | $5 |
| Vercel | 2-3 deployments | Free tier |
| **Total** | | **$5** |

At 100 agencies: ~$300/month (Supabase Pro + usage)

---

## Next Steps

1. ✅ Complete Steps 1–4 (takes 45 min total)
2. ✅ Invite first 3 agencies to test (email + onboarding docs)
3. ✅ Collect feedback → iterate on UI/features
4. ✅ At 10+ agencies: enable Sentry + rate limiting
5. ✅ At 100+ agencies: implement billing system + regional replicas

---

**Questions?** Check SCALABILITY.md or SCALE_READY.md for architecture details.
