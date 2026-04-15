# AgentAI — פלטפורמת סוכני נדל״ן

Next.js 14 + Supabase + Anthropic. ממשק מלא בעברית (RTL).

## הגדרה ראשונית

1. **Supabase**: פתח פרויקט חדש ב-[supabase.com](https://supabase.com), הרץ את המיגרציה:
   ```bash
   # מתוך SQL Editor בדשבורד של Supabase — הדבק את התוכן של:
   supabase/migrations/0001_init.sql
   ```
   או עם Supabase CLI:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```

2. **Anthropic**: הפק API key ב-[console.anthropic.com](https://console.anthropic.com).

3. **משתני סביבה**: העתק `.env.local.example` ל-`.env.local` ומלא:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `CRON_SECRET` (לדוח שבועי — ייצר מחרוזת אקראית)

4. **התקנה והרצה**:
   ```bash
   npm install
   npm run dev
   ```
   פתח `http://localhost:3000/signup` וצור חשבון סוכן.

## סקריפטים

- `npm run dev` — הרצת הפיתוח
- `npm run build` — בנייה לפרודקשן
- `npm run typecheck` — בדיקת טיפוסים
- `npm run test` — הרצת טסטים (scoring + matching)
- `npm run db:types` — רענון טיפוסי DB (דורש Supabase CLI)

## מבנה

- `app/(auth)` — התחברות / הרשמה
- `app/(app)` — לוח בקרה, נכסים, לידים, תוכן, דוחות (מוגן אוטנטיקציה)
- `app/api` — API routes (AI, WhatsApp webhook, cron)
- `lib/` — Supabase clients, Anthropic, scoring, matching, formatters
- `components/ui` — רכיבי UI בסיסיים (shadcn style)
- `supabase/migrations` — סכמת DB + RLS

## WhatsApp

Phase 1 רץ ב-**sandbox mode**: הודעות יוצאות נרשמות ב-`conversations` ובקונסול במקום להישלח ל-Meta. לאינטגרציה אמיתית החלף את `lib/whatsapp/sandbox.ts` ב-adapter שקורא ל-Meta Cloud API / 360dialog / Twilio.

כדי לבדוק הודעה נכנסת:
```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "content-type: application/json" \
  -d '{"agent_id":"<your-agent-uuid>","from":"0501234567","body":"היי, מחפש דירה 4 חדרים ברמת אביב עד 3 מיליון"}'
```

## מה כלול ב-Phase 1

- ✅ Auth + Multi-tenant RLS
- ✅ לוח בקרה עם מטריקות ופעילות
- ✅ ניהול נכסים + העלאת תמונות + יצירת תיאור AI
- ✅ Lead pipeline (Kanban) + ניקוד אוטומטי
- ✅ אלגוריתם התאמה בין לידים לנכסים
- ✅ יצירת תוכן לאינסטגרם / פייסבוק / מודעות (בודד + batch של 30)
- ✅ WhatsApp sandbox + זרימת סינון AI
- ✅ דוח ROI שבועי (cron)

## מה דחוי ל-Phase 2+

סוכן טלפוני · קמפיינים לפייסבוק · בינת שיחות · עוזר אישי · תיאום צפיות רב-צדדי · warming pipeline · Facebook/Yad2 webhooks · voice note → listing · BSP אמיתי.
