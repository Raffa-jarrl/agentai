import { NextResponse } from "next/server";
import { anthropic, cachedSystem, MODEL_SMART } from "@/lib/anthropic/client";
import { CONTENT_GENERATION } from "@/lib/anthropic/prompts";
import { createClient } from "@/lib/supabase/server";
import { generateContentSchema } from "@/lib/validation/schemas";
import { formatILS } from "@/lib/formatters/currency";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = generateContentSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const { listing_id, topic, post_type, platform } = parsed.data;

  let listingContext = "";
  let image_urls: string[] = [];
  if (listing_id) {
    const { data: listing } = await supabase
      .from("listings")
      .select("title, description, city, neighborhood, price, rooms, size_sqm, photos")
      .eq("id", listing_id)
      .single();
    if (listing) {
      listingContext = [
        `נכס: ${listing.title}`,
        `מיקום: ${listing.city}${listing.neighborhood ? ", " + listing.neighborhood : ""}`,
        listing.rooms && `${listing.rooms} חד׳`,
        listing.size_sqm && `${listing.size_sqm} מ״ר`,
        listing.price && `מחיר: ${formatILS(listing.price)}`,
        listing.description && `תיאור: ${listing.description}`,
      ].filter(Boolean).join("\n");
      image_urls = listing.photos ?? [];
    }
  }

  const userContent = [
    `סוג פוסט: ${post_type}`,
    `פלטפורמה: ${platform}`,
    listingContext,
    topic && `נושא: ${topic}`,
  ].filter(Boolean).join("\n\n");

  const res = await anthropic().messages.create({
    model: MODEL_SMART,
    max_tokens: 1200,
    system: cachedSystem(CONTENT_GENERATION),
    messages: [{ role: "user", content: userContent }],
  });

  const text = res.content.filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text").map((b) => b.text).join("\n").trim();
  let json: { caption?: string; hashtags?: string[]; caption_facebook?: string; caption_ad?: string } = {};
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) json = JSON.parse(match[0]);
  } catch {}

  const { data: post, error } = await supabase
    .from("content_posts")
    .insert({
      agent_id: user.id,
      listing_id: listing_id ?? null,
      platform,
      caption_hebrew: json.caption ?? text,
      caption_facebook: json.caption_facebook ?? null,
      caption_ad: json.caption_ad ?? null,
      hashtags: json.hashtags ?? [],
      image_urls,
      post_type,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: post.id });
}
