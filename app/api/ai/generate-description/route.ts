import { NextResponse } from "next/server";
import { z } from "zod";
import { anthropic, cachedSystem, MODEL_SMART } from "@/lib/anthropic/client";
import { LISTING_DESCRIPTION } from "@/lib/anthropic/prompts";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  title: z.string().optional(),
  property_type: z.string().optional(),
  rooms: z.number().optional().nullable(),
  size_sqm: z.number().optional().nullable(),
  price: z.number().optional().nullable(),
  city: z.string().optional(),
  neighborhood: z.string().optional().nullable(),
  features: z.array(z.string()).optional().default([]),
  hint: z.string().optional(),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const d = parsed.data;

  const userContent = [
    d.title && `כותרת: ${d.title}`,
    d.property_type && `סוג נכס: ${d.property_type}`,
    d.rooms && `חדרים: ${d.rooms}`,
    d.size_sqm && `גודל: ${d.size_sqm} מ״ר`,
    d.price && `מחיר: ₪${d.price.toLocaleString("he-IL")}`,
    d.city && `עיר: ${d.city}`,
    d.neighborhood && `שכונה: ${d.neighborhood}`,
    d.features.length > 0 && `תכונות: ${d.features.join(", ")}`,
    d.hint && `הערות הסוכן: ${d.hint}`,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await anthropic().messages.create({
    model: MODEL_SMART,
    max_tokens: 800,
    system: cachedSystem(LISTING_DESCRIPTION),
    messages: [{ role: "user", content: userContent }],
  });

  const text = res.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return NextResponse.json({ description: text });
}
