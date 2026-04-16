import { NextRequest, NextResponse } from "next/server";
import { requireAgent } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { supabase, user } = await requireAgent();
    const { data, error } = await supabase
      .from("agents")
      .select("id, full_name, phone, business_name, whatsapp_business_number, email")
      .eq("id", user.id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, user } = await requireAgent();
    const body = await req.json() as {
      full_name?: string;
      phone?: string;
      business_name?: string;
      whatsapp_business_number?: string;
    };

    const { data, error } = await supabase
      .from("agents")
      .update(body)
      .eq("id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
