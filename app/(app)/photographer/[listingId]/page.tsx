import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PhotographerUpload } from "@/components/photographer/PhotographerUpload";

export default async function PhotographerPage({ params }: { params: { listingId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, city, neighborhood, property_type")
    .eq("id", params.listingId)
    .single();

  if (!listing) redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-end mb-1">העלאת תמונות לנכס</h1>
      <p className="text-slate-500 text-end mb-6">{listing.title} · {listing.city}</p>
      <PhotographerUpload listingId={listing.id as string} agentId="" />
    </div>
  );
}
