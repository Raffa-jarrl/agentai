/** Normalize any Israeli phone input to E.164 "+972..." form. Returns null if unparseable. */
export function normalizeIsraeliPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("972")) return "+" + digits;
  if (digits.startsWith("0")) return "+972" + digits.slice(1);
  if (digits.length === 9) return "+972" + digits;
  return null;
}

/** Format +972501234567 → 050-123-4567 for display. */
export function formatIsraeliPhone(e164: string | null | undefined): string {
  if (!e164) return "—";
  const d = e164.replace(/\D/g, "");
  if (!d.startsWith("972")) return e164;
  const local = "0" + d.slice(3);
  if (local.length === 10) return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  if (local.length === 9) return `${local.slice(0, 2)}-${local.slice(2, 5)}-${local.slice(5)}`;
  return local;
}
