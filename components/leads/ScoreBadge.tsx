import { Badge } from "@/components/ui/badge";
import type { LeadScoreTier } from "@/types/database";

const labels: Record<LeadScoreTier, string> = { hot: "חם", warm: "פושר", cold: "קר" };

export function ScoreBadge({ tier, value }: { tier: LeadScoreTier; value?: number }) {
  return (
    <Badge variant={tier}>
      {labels[tier]}{value != null ? ` · ${value}` : ""}
    </Badge>
  );
}
