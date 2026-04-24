import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/whatsapp/sandbox";

// Vapi server webhook — receives call lifecycle events. We care about
// `end-of-call-report`: when a call ends, read the WhatsApp queue for that
// call and send the summary to the caller.
//
// Vapi also posts `status-update`, `transcript`, `tool-calls`, `hang`, etc.
// to the same URL if it's set at the assistant level. We only act on
// end-of-call-report and ignore the rest.

interface VapiEvent {
  message?: {
    type?: string;
    call?: {
      id?: string;
      customer?: { number?: string };
    };
    endedReason?: string;
    summary?: string;
  };
}

function formatPriceSimple(price: number): string {
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return m === Math.floor(m) ? `${m} מיליון ₪` : `${m.toFixed(2)} מיליון ₪`;
  }
  if (price >= 1000) return `${(price / 1000).toLocaleString("he-IL")} אלף ₪`;
  return `${price.toLocaleString("he-IL")} ₪`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as VapiEvent;
  const type = body.message?.type;
  const callId = body.message?.call?.id;
  const callerPhone = body.message?.call?.customer?.number;

  // Acknowledge non-interesting events quickly.
  if (type !== "end-of-call-report" || !callId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const svc = createServiceClient();

  // Pull the WhatsApp queue for this call.
  const { data: queued } = await svc
    .from("call_whatsapp_queue")
    .select("*")
    .eq("call_id", callId)
    .eq("sent", false)
    .order("created_at", { ascending: true });

  if (!queued || queued.length === 0) {
    return NextResponse.json({ ok: true, queued: 0 });
  }

  if (!callerPhone) {
    // We captured listings but have no phone to send to. Leave them in the
    // queue for manual follow-up; Arik can see them on the dashboard.
    return NextResponse.json({ ok: true, queued: queued.length, no_phone: true });
  }

  // Compose the Hebrew message.
  const header = `שלום! להלן הנכסים שביקשת מספקטרה נדל״ן:\n`;
  const lines = queued.map((q, i) => {
    const parts = [
      q.street ? `📍 ${q.street}` : null,
      q.rooms ? `🛏 ${q.rooms} חדרים` : null,
      q.size_sqm ? `📐 ${q.size_sqm} מ״ר` : null,
      q.floor != null ? `🏢 קומה ${q.floor}` : null,
      q.price ? `💰 ${formatPriceSimple(q.price)}` : null,
    ].filter(Boolean).join(" · ");
    return `\n${i + 1}. ${q.title}\n${parts}\n🔗 ${q.listing_url}`;
  }).join("\n");
  const footer = `\n\nלתיאום צפייה ולכל שאלה — ניתן להשיב להודעה זו או להתקשר.\nבברכה, אריק | ספקטרה נדל״ן`;
  const message = `${header}${lines}${footer}`;

  // Find the owning agent (Spectra is single-tenant for now — pick the first
  // agent so the sandbox sender has an agent_id to scope under).
  const { data: agent } = await svc
    .from("agents")
    .select("id")
    .limit(1)
    .maybeSingle();

  try {
    await sendWhatsApp(
      { to: callerPhone, body: message },
      agent?.id ?? "00000000-0000-0000-0000-000000000000",
    );
    await svc
      .from("call_whatsapp_queue")
      .update({ sent: true })
      .eq("call_id", callId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[call-ended] WhatsApp send failed:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }

  // Clean up the search cache too — no longer needed after call ends.
  await svc.from("call_search_results").delete().eq("call_id", callId);

  return NextResponse.json({ ok: true, sent: queued.length, to: callerPhone });
}
