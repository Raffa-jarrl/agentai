import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingForm } from "@/components/listings/ListingForm";

export default async function NewListingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">נכס חדש</h1>
      <ListingForm agentId={user.id} />
    </div>
  );
}
