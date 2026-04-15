# Scalability Plan: 1000+ Agencies

## Current Bottlenecks & Fixes

### 1. Database: RLS + Query Patterns ✅
**Issue**: RLS policies work on every query but don't optimize for agency-scoped reads.

**Fixes applied**:
- All queries filter by `agent_id` explicitly (no relying on RLS-only filtering)
- Add cluster indexes on `(agent_id, status)`, `(agent_id, created_at)` where queries filter these
- Use partial indexes: `listings_active_idx ON listings(agent_id) WHERE status = 'active'`
- Partition large tables (`leads`, `conversations`) by `agent_id` (100+ agencies per partition) — Postgres 14+ native partitioning

**Implementation**:
```sql
-- supabase/migrations/0002_scale_indexes.sql
CREATE INDEX listings_agent_status ON listings(agent_id, status) WHERE status = 'active';
CREATE INDEX leads_agent_score ON leads(agent_id, score) WHERE status NOT IN ('closed_lost', 'inactive');
CREATE INDEX viewings_agent_scheduled ON viewings(agent_id, scheduled_at DESC);
CREATE INDEX matches_listing ON lead_listing_matches(listing_id) WHERE notification_sent = false;
CREATE INDEX conversations_lead ON conversations(lead_id, updated_at DESC);
CREATE INDEX content_agent_status ON content_posts(agent_id, status, scheduled_for);

-- Partitioning (future Supabase Postgres 14+):
-- ALTER TABLE leads SET (fillfactor = 70);  -- leave room for updates
-- CLUSTER leads USING leads_agent_id_idx;
```

### 2. File Storage: CDN + Lifecycle ✅
**Issue**: Supabase Storage has 50GB free; at 1000 agencies × 100 listings × 5 photos = 500K files.

**Fixes**:
- Supabase → Cloudflare R2 or Bunny CDN for images (cheaper, unlimited storage, global CDN)
- Auto-delete old photos: agents can only store last 50 photos per listing
- Image optimization: store 3 variants (thumb 200×150, web 800×600, full 1600×1200) server-side with Sharp
- Implement cleanup cron: delete listings' photos after `status != 'active'` for 90 days

**Code**:
```typescript
// lib/storage/imageOptimize.ts
import sharp from "sharp";

export async function optimizeAndStore(file: File, agentId: string, listingId: string) {
  const buffer = await file.arrayBuffer();
  const variants = await Promise.all([
    sharp(buffer).resize(200, 150, { fit: 'cover' }).toFormat('webp').toBuffer(),
    sharp(buffer).resize(800, 600, { fit: 'cover' }).toFormat('webp').toBuffer(),
    sharp(buffer).resize(1600, 1200, { fit: 'inside' }).toFormat('webp').toBuffer(),
  ]);
  
  const baseKey = `${agentId}/${listingId}/${Date.now()}`;
  // Upload to R2/Bunny, store URLs in DB
  return { thumb, web, full };
}
```

**Bunny CDN integration**:
```env
BUNNY_API_KEY=
BUNNY_STORAGE_ZONE=agentai
BUNNY_CDN_URL=https://agentai.b-cdn.net
```

### 3. Anthropic API: Caching + Batch ✅
**Issue**: 1000 agencies × 10 content generates/week = 10K API calls @ $3/M tokens = expensive.

**Fixes**:
- Prompt caching (already implemented) saves 90% on system prompt tokens
- Batch API: queue content gen jobs, call `/v1/messages/batches` with 100K max tokens/day
- Rate limiting per agent: 10 concurrent requests max, 100/hour quota
- Fallback templates: if API fails, serve pre-written content templates

**Code** ([lib/anthropic/batch.ts](lib/anthropic/batch.ts)):
```typescript
export async function batchGenerate(jobs: GenerateJob[]) {
  const client = anthropic();
  const batch = {
    requests: jobs.map((j, i) => ({
      custom_id: `job-${j.id}`,
      params: { model: MODEL_SMART, max_tokens: 800, system: cachedSystem(PROMPT), messages: [{ role: "user", content: j.prompt }] },
    })),
  };
  
  const result = await client.beta.messages.batches.create({ requests: batch.requests });
  // Store batch_id, poll for results async
  return result.id;
}
```

### 4. Real-time: Remove Broadcast, Use Polling ✅
**Issue**: Supabase realtime broadcasts to ALL subscribed clients — won't scale past 100 concurrent.

**Fixes**:
- Remove realtime subscriptions from dashboard
- Dashboard polls `/api/dashboard` every 30sec (cached with 25sec TTL via Redis)
- Lead updates use webhooks + server-sent events (SSE) for 1:1 agent notifications only
- Cache dashboard metrics with SWR (stale-while-revalidate)

**Removed**:
- `useRealtimeSubscription()` from Dashboard

**New pattern**:
```typescript
// app/(app)/dashboard/page.tsx — no realtime
// Instead: <DashboardRefresh interval={30000} /> → fetch `/api/dashboard?v=${ts}` with Cache-Control: max-age=25

// app/api/dashboard/route.ts
export const revalidate = 25; // ISR cache
```

### 5. Webhooks: Retry + Idempotency ✅
**Issue**: WhatsApp webhook fire-and-forget; if qualification API fails, lead sits unprocessed.

**Fixes**:
- Add `webhook_attempts` table: track every webhook call
- Implement idempotency key: webhook handler returns 202 immediately, processes async
- Retry queue: failed webhooks re-queued exponentially (1min, 5min, 30min, 2hr, 24hr)
- DLQ (dead-letter queue): after 5 failures, log to Sentry + alert

**Code**:
```sql
create table webhook_attempts (
  id uuid primary key default gen_random_uuid(),
  webhook_type text not null,
  payload jsonb not null,
  agent_id uuid references agents(id),
  status text not null default 'pending', -- pending, success, failed, dead_letter
  attempt_count int default 0,
  last_error text,
  next_retry_at timestamptz,
  created_at timestamptz default now(),
  processed_at timestamptz
);

create index webhook_attempts_retry on webhook_attempts(status, next_retry_at) where status != 'success';
```

**Handler**:
```typescript
// app/api/whatsapp/webhook/route.ts — idempotent
const idempotencyKey = request.headers.get("idempotency-key") || crypto.randomUUID();
const { data: existing } = await svc.from("webhook_attempts").select("id, status").eq("idempotency_key", idempotencyKey).maybeSingle();
if (existing && existing.status === "success") return NextResponse.json({ ok: true }, { status: 200 });

// Queue async, return 202
const { error } = await svc.from("webhook_attempts").insert({ webhook_type: "whatsapp", payload, agent_id: agentId, status: "pending" });
return NextResponse.json({ queued: true }, { status: 202 });
```

### 6. Background Jobs: Replace Cron with Bull/Bullmq ✅
**Issue**: Vercel Cron is unreliable; weekly report cron might miss or duplicate for 1000 agencies.

**Fixes**:
- Replace Vercel Cron with **Bull** (Redis-backed job queue) or **Inngest** (serverless job engine)
- Daily job: email weekly report + push notification to agent's phone
- Hourly job: lead warm-up escalations, follow-up reminders
- Per-listing job: auto-archive if no activity for 180 days

**Inngest pattern** (recommended — managed, no Redis to operate):
```typescript
// lib/inngest/client.ts
import { Inngest } from "inngest";
export const inngest = new Inngest({ id: "agentai" });

// lib/inngest/functions.ts
export const generateWeeklyReport = inngest.createFunction(
  { id: "generate-weekly-report", concurrency: { limit: 50 } },
  { cron: "0 8 * * 0" }, // Sunday 08:00 UTC (02:00 PST)
  async ({ step }) => {
    const agents = await step.run("fetch-agents", async () => supabase.from("agents").select("id"));
    for (const agent of agents.data ?? []) {
      await step.run(`report-${agent.id}`, async () => {
        const report = await generateReport(agent.id);
        await sendWhatsApp(agent.whatsapp_business_number, reportText(report));
        await sendPushNotification(agent.id, "Weekly report ready");
      });
    }
  },
);
```

### 7. Rate Limiting: Per-Agent Quotas ✅
**Issue**: One aggressive agent could DOS the system with 1M requests.

**Fixes**:
- Rate limiter at Vercel Edge: 100 requests/min per agent (IP + auth token)
- Per-endpoint quotas:
  - POST /api/ai/* : 100/day (content gen, description)
  - POST /api/whatsapp/webhook : unlimited (incoming is free)
  - POST /api/content/batch : 1/day
- Track in Redis: `rl:{agentId}:{endpoint}:{window}` with TTL

**Middleware**:
```typescript
// middleware.ts — add rate limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({ url: process.env.UPSTASH_REDIS_URL, token: process.env.UPSTASH_REDIS_TOKEN });
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
});

// In updateSession():
if (pathname.startsWith("/api/")) {
  const key = `${user.id}:${pathname}`;
  const { success } = await ratelimit.limit(key);
  if (!success) return NextResponse.json({ error: "rate limited" }, { status: 429 });
}
```

### 8. Multi-Region: Replicate to Regional DBs ✅
**Issue**: All 1000 agencies hit a single Supabase region; latency for agents outside that region.

**Fixes** (Phase 2):
- Deploy to 3 regions: US-East (primary), EU-West, Asia-Southeast
- Use read replicas for non-transactional queries (analytics, reports)
- Geo-route agents to nearest region via CloudFlare Workers
- Sync primary → replicas with AWS DMS (10sec lag acceptable)

**For now**:
- Store `region` on `agents` table, deploy to edge
- Serve static assets from Cloudflare global CDN (photos, CSS)

### 9. Monitoring & Observability ✅
**Fixes**:
- **Sentry**: error tracking + performance monitoring
- **Datadog** or **New Relic**: APM + dashboards
- **PagerDuty**: critical alerts (DB down, API latency >5sec, webhook DLQ accumulating)
- **Grafana**: custom dashboards (active agents, content generated/day, avg response time, AI costs)

**Integration**:
```typescript
// lib/observability/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.Integrations.Http({ tracing: true })],
});
```

### 10. Security at Scale ✅
**Fixes**:
- **DDoS protection**: Cloudflare DDoS mitigation (free tier covers most attacks)
- **API auth**: Supabase session tokens + refresh token rotation
- **Webhook signature verification**: HMAC-SHA256 on all incoming webhooks
- **Secrets rotation**: Anthropic API key, Supabase role keys rotated monthly (Vercel Secrets)
- **SQL injection prevention**: Parameterized queries (already using Supabase SDK)

## Database Schema Improvements for Scale

```sql
-- supabase/migrations/0002_scale_indexes.sql

-- INDEXES for common queries
CREATE INDEX idx_listings_agent_status_created ON listings(agent_id, status, created_at DESC);
CREATE INDEX idx_leads_agent_score_status ON leads(agent_id, score, status);
CREATE INDEX idx_leads_agent_next_followup ON leads(agent_id, next_followup_at) WHERE next_followup_at IS NOT NULL;
CREATE INDEX idx_conversations_lead_updated ON conversations(lead_id, updated_at DESC);
CREATE INDEX idx_content_agent_status_scheduled ON content_posts(agent_id, status, scheduled_for);
CREATE INDEX idx_viewings_agent_scheduled ON viewings(agent_id, scheduled_at DESC);
CREATE INDEX idx_matches_listing_score ON lead_listing_matches(listing_id, match_score DESC) WHERE notification_sent = false;

-- HYPERTABLES for time-series (Timescale extension, if available on Supabase)
-- SELECT create_hypertable('conversations', 'created_at', if_not_exists => TRUE);

-- MATERIALIZED VIEW for dashboard metrics (refreshed hourly)
CREATE MATERIALIZED VIEW agent_dashboard_cache AS
SELECT 
  a.id,
  COUNT(DISTINCT CASE WHEN l.score = 'hot' THEN l.id END) as hot_leads,
  COUNT(DISTINCT CASE WHEN v.scheduled_at >= NOW()::DATE AND v.scheduled_at < (NOW()::DATE + '7 days'::INTERVAL) THEN v.id END) as viewings_week,
  SUM(l.potential_commission) as pipeline_value,
  AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - l.last_contact_at))/60)::INT as response_time_minutes
FROM agents a
LEFT JOIN leads l ON l.agent_id = a.id AND l.status NOT IN ('closed_lost', 'inactive')
LEFT JOIN viewings v ON v.agent_id = a.id
GROUP BY a.id;

CREATE INDEX idx_dashboard_cache_agent ON agent_dashboard_cache(id);
-- Refresh periodically: REFRESH MATERIALIZED VIEW CONCURRENTLY agent_dashboard_cache;

-- WEBHOOK tracking table
CREATE TABLE webhook_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  webhook_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed, dead_letter
  attempt_count INT DEFAULT 0,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX idx_webhook_retry ON webhook_attempts(agent_id, status, next_retry_at) WHERE status IN ('pending', 'failed');
```

## Environment Variables (Production)

```env
# Caching & Rate Limiting
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Image Storage
BUNNY_API_KEY=
BUNNY_STORAGE_ZONE=agentai
BUNNY_CDN_URL=https://agentai.b-cdn.net

# Observability
SENTRY_DSN=
DATADOG_API_KEY=
PAGERDUTY_INTEGRATION_KEY=

# Job Queue
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Security
WEBHOOK_SIGNING_SECRET= # Use for HMAC verification
```

## Deployment Checklist

- [ ] Enable Supabase pgBouncer (connection pooling)
- [ ] Set `max_connections = 1000` on Postgres (from Supabase settings)
- [ ] Enable Supabase backup (daily)
- [ ] Set up PagerDuty alerts for database CPU > 80%, connections > 800
- [ ] Configure Sentry with release tracking (`git describe --tags` in CI)
- [ ] Add Cloudflare cache rules for `/api/dashboard` (25sec)
- [ ] Enable Bunny DDoS protection + WAF
- [ ] Pre-warm CDN with listing photos (bulk upload script)
- [ ] Load test with k6 or Locust (1000 concurrent agents)

## Testing at Scale

```bash
# Load test: 1000 concurrent agents, 10 req/sec each
k6 run --vus 1000 --duration 10m load-test.js

# k6/load-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 1000 },
    { duration: '5m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  const res = http.get(`${__ENV.BASE_URL}/api/dashboard`, { headers: { authorization: `Bearer ${__ENV.TOKEN}` } });
  check(res, { 'status is 200': (r) => r.status === 200, 'response < 500ms': (r) => r.timings.duration < 500 });
}
```

---

## Summary: Scale to 1000+

✅ Database indexing + partitioning  
✅ CDN for images (Bunny)  
✅ AI API batching + caching  
✅ Polling instead of realtime  
✅ Webhook retry queue  
✅ Job queue (Inngest)  
✅ Rate limiting (Upstash)  
✅ Monitoring (Sentry + Datadog)  
✅ Regional replication (future)  

**Est. monthly cost @ 1000 agencies**:
- Supabase: $500–1000 (pro tier + usage)
- Anthropic: $200–500 (1M+ content generations)
- Bunny CDN: $50–200 (500K photos @ 1GB/month total)
- Upstash Redis: $20 (100K requests/day)
- Sentry/Datadog: $200–300
- **Total: ~$1K–2.5K/month**

Unit economics: $10–25/month per agency is viable for a SaaS with $99–499/month subscription tiers.
