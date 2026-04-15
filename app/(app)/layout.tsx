import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav/Sidebar";
import { BottomNav } from "@/components/nav/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: agent } = await supabase.from("agents").select("full_name, business_name").eq("id", user.id).single();
  const label = agent?.business_name || agent?.full_name || user.email || "";

  return (
    <div className="min-h-screen flex">
      <Sidebar agentName={label} />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="container py-4 md:py-8">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
