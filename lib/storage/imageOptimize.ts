import { createClient } from "@/lib/supabase/server";

/**
 * Image optimization for production scale.
 * For Phase 1: store full images in Supabase Storage.
 * For Phase 2: integrate with Bunny CDN, generate 3 variants (thumb, web, full).
 *
 * For now: validate file size, compress, store directly.
 */

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function validateImage(file: File): Promise<string | null> {
  if (!ALLOWED_TYPES.includes(file.type)) return "Unsupported image format (JPEG, PNG, WebP only)";
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `Image too large (max ${MAX_FILE_SIZE_MB}MB)`;
  return null;
}

/**
 * Upload a single image to Supabase Storage.
 * Returns public URL.
 */
export async function uploadListingPhoto(file: File, agentId: string, listingId: string): Promise<string> {
  const error = await validateImage(file);
  if (error) throw new Error(error);

  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${agentId}/${listingId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, file, { upsert: false });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Cleanup old photos (keep last 50 per listing)
 * Call this weekly in background job.
 */
export async function cleanupOldPhotos(agentId: string) {
  const supabase = createClient();

  // Get all listings for this agent, delete photos on archived listings older than 90 days
  const { data: listings } = await supabase
    .from("listings")
    .select("id, photos")
    .eq("agent_id", agentId)
    .or(`status.eq.inactive,and(updated_at.lt.${new Date(Date.now() - 90 * 86400000).toISOString()},status.eq.sold)`)
    .limit(1000);

  let deleted = 0;
  for (const listing of listings ?? []) {
    if (listing.photos?.length) {
      for (const photoUrl of listing.photos) {
        // Extract path from URL: https://xxx.supabase.co/storage/v1/object/public/listing-photos/{agentId}/{listingId}/{ts}.jpg
        const match = photoUrl.match(/listing-photos\/(.+)$/);
        if (match) {
          await supabase.storage.from("listing-photos").remove([match[1]]);
          deleted += 1;
        }
      }
    }
  }
  return { deleted };
}

/**
 * For future Bunny CDN integration:
 * export async function uploadToBunny(file: File, path: string): Promise<string> {
 *   const buffer = await file.arrayBuffer();
 *   const res = await fetch(`${process.env.BUNNY_STORAGE_ZONE_URL}/${path}`, {
 *     method: "PUT",
 *     headers: { "Content-Type": file.type, "AccessKey": process.env.BUNNY_API_KEY },
 *     body: buffer,
 *   });
 *   return `${process.env.BUNNY_CDN_URL}/${path}`;
 * }
 */
