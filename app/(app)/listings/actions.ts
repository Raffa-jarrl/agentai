"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { listingSchema } from "@/lib/validation/schemas";
import { runMatchingForListing } from "@/lib/matching/runMatching";

export async function createListing(input: z.infer<typeof listingSchema> & { photos: string[]; ai_generated_description?: string }) {
  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "פרטים לא תקינים" };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const { data, error } = await supabase
    .from("listings")
    .insert({
      agent_id: user.id,
      ...parsed.data,
      photos: input.photos,
      ai_generated_description: input.ai_generated_description ?? null,
      description: parsed.data.description ?? input.ai_generated_description ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await runMatchingForListing(data.id, user.id);
  revalidatePath("/listings");
  redirect(`/listings/${data.id}`);
}

export async function updateListingStatus(listingId: string, status: "active" | "sold" | "rented" | "inactive") {
  const supabase = createClient();
  const { error } = await supabase.from("listings").update({ status }).eq("id", listingId);
  if (error) return { error: error.message };
  revalidatePath("/listings");
  revalidatePath(`/listings/${listingId}`);
  return { ok: true };
}
