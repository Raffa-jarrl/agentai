import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { photos, notes } = await req.json() as { photos: string[]; notes?: string };
  const svc = createServiceClient();

  // Get listing to find agent_id
  const { data: listing } = await svc.from("listings").select("agent_id").eq("id", params.id).single();
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const { data, error } = await svc.from("photo_submissions").insert({
    listing_id: params.id,
    photographer_id: user.id,
    agent_id: listing.agent_id as string,
    photos,
    notes,
    status: "pending",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { submission_id, status, rejection_reason } = await req.json() as {
    submission_id: string;
    status: string;
    rejection_reason?: string;
  };
  const svc = createServiceClient();

  // Update submission
  const { data: submission, error } = await svc
    .from("photo_submissions")
    .update({ status, rejection_reason, reviewed_at: new Date().toISOString() })
    .eq("id", submission_id)
    .eq("agent_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If approved, update listing photos
  if (status === "approved" && submission) {
    await svc.from("listings").update({ photos: (submission as { photos: string[] }).photos }).eq("id", params.id);
  }

  return NextResponse.json(submission);
}
