import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Vapi tool webhook — called by the voice agent when a caller says "yes, add
// that one to my WhatsApp list". The tool takes a `listing_number` (1..5)
// referring to a listing from the most recent search_listings call during
// this same phone call. We look up the full listing in `call_search_results`
// (populated by the search tool) and insert it into `call_whatsapp_queue`.
// On call end, the call-ended webhook reads that queue and sends the summary.

interface VapiToolCall {
  message?: {
    call?: { id?: string; customer?: { number?: string } };
    toolCalls?: Array<{
      id: string;
      function: { name: string; arguments: Record<string, unknown> };
    }>;
  };
}

interface QueueArgs {
  listing_number?: number;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as VapiToolCall;
  const toolCall = body.message?.toolCalls?.[0];
  if (!toolCall) return NextResponse.json({ error: "no tool call" }, { status: 400 });

  const callId = body.message?.call?.id;
  const callerPhone = body.message?.call?.customer?.number ?? null;
  const args = toolCall.function.arguments as QueueArgs;
  const listingNumber = Number(args.listing_number);

  if (!callId || !Number.isFinite(listingNumber) || listingNumber < 1) {
    return NextResponse.json({
      results: [{ toolCallId: toolCall.id, result: "לא הצלחתי להוסיף — חסר מספר נכס תקין." }],
    });
  }

  const svc = createServiceClient();

  // Resolve listing_number → full listing from the per-call cache written by
  // search_listings.
  const { data: cached } = await svc
    .from("call_search_results")
    .select("*")
    .eq("call_id", callId)
    .eq("listing_number", listingNumber)
    .maybeSingle();

  if (!cached) {
    return NextResponse.json({
      results: [{ toolCallId: toolCall.id, result: "לא מצאתי את הנכס הזה ברשימה. בואי נחפש שוב." }],
    });
  }

  // Skip duplicates (agent sometimes confirms twice).
  const { data: existing } = await svc
    .from("call_whatsapp_queue")
    .select("id")
    .eq("call_id", callId)
    .eq("listing_url", cached.url)
    .maybeSingle();

  if (!existing) {
    await svc.from("call_whatsapp_queue").insert({
      call_id: callId,
      caller_phone: callerPhone,
      listing_url: cached.url,
      title: cached.title,
      street: cached.street,
      price: cached.price,
      rooms: cached.rooms,
      size_sqm: cached.size_sqm,
      floor: cached.floor,
      listing_type: cached.listing_type,
    });
  }

  // Count how many are queued so far so the agent can say "great, 3 listings queued".
  const { count } = await svc
    .from("call_whatsapp_queue")
    .select("*", { count: "exact", head: true })
    .eq("call_id", callId);

  return NextResponse.json({
    results: [
      {
        toolCallId: toolCall.id,
        result: `מצוין. הוספתי את הנכס ברחוב ${cached.street ?? "אריאל"} לרשימה. יש לך כרגע ${count ?? 1} נכסים ברשימת הוואטסאפ.`,
      },
    ],
  });
}
