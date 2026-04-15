"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContentStatus } from "@/types/database";

export async function updatePost(id: string, patch: { caption_hebrew?: string; caption_facebook?: string | null; caption_ad?: string | null; status?: ContentStatus; scheduled_for?: string | null }) {
  const supabase = createClient();
  const { error } = await supabase.from("content_posts").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/content");
  return { ok: true };
}

export async function deletePost(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("content_posts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/content");
  return { ok: true };
}
