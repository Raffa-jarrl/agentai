"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validation/schemas";
import { normalizeIsraeliPhone } from "@/lib/formatters/phone";

export async function signupAction(_prev: unknown, formData: FormData) {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "פרטים לא תקינים" };

  const { email, password, full_name, phone, business_name } = parsed.data;
  const normalized = normalizeIsraeliPhone(phone) ?? phone;

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, phone: normalized, business_name: business_name ?? null } },
  });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function loginAction(_prev: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "פרטים לא תקינים" };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "אימייל או סיסמה שגויים" };

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
