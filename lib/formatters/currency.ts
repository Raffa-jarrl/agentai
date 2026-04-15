export function formatILS(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("he-IL").format(n);
}
