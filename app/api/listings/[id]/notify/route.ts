import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/whatsapp/sandbox";
import { formatILS } from "@/lib/formatters/currency";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { match_id } = await req.json();
  const { data: match } = await supabase
    .from("lead_listing_matches")
    .select("id, lead:leads(id, full_name, phone), listing:listings(id, title, city, neighborhood, price, rooms)")
    .eq("id", match_id)
    .eq("listing_id", params.id)
    .single();

  if (!match || !match.lead || !match.listing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const listing = match.listing as unknown as { title: string; city: string; neighborhood: string | null; price: number; rooms: number | null };
  const lead = match.lead as unknown as { id: string; full_name: string; phone: string };

  const body = `שלום ${lead.full_name.split(" ")[0]}, מצאתי נכס שיכול להתאים לך:
${listing.title}
${listing.city}${listing.neighborhood ? " · " + listing.neighborhood : ""}${listing.rooms ? ` · ${listing.rooms} חד׳` : ""}
${formatILS(listing.price)}

מעניין לצפות?`;

  await sendWhatsApp({ to: lead.phone, body }, user.id, lead.id);

  await supabase
    .from("lead_listing_matches")
    .update({ notification_sent: true, notification_sent_at: new Date().toISOString() })
    .eq("id", match.id);

  return NextResponse.json({ ok: true });
}
