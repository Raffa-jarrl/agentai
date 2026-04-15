import { describe, expect, it } from "vitest";
import { scoreLead } from "./leadScore";

describe("scoreLead", () => {
  const baseLead = {
    mortgage_approved: null as boolean | null,
    budget_min: null as number | null,
    budget_max: null as number | null,
    timeline: null as "immediate" | "1_3_months" | "3_6_months" | "exploring" | null,
    last_contact_at: null as string | null,
  };

  it("returns cold for an empty lead", () => {
    const r = scoreLead({ lead: baseLead, activeListings: [] });
    expect(r.value).toBe(0);
    expect(r.tier).toBe("cold");
  });

  it("scores mortgage + immediate + recent contact as hot", () => {
    const now = new Date("2026-04-15T12:00:00Z");
    const r = scoreLead({
      lead: {
        ...baseLead,
        mortgage_approved: true,
        timeline: "immediate",
        last_contact_at: new Date(now.getTime() - 86400000).toISOString(),
      },
      activeListings: [],
      now,
    });
    expect(r.value).toBeGreaterThanOrEqual(70);
    expect(r.tier).toBe("hot");
    expect(r.reasons).toContain("mortgage_approved");
    expect(r.reasons).toContain("timeline_immediate");
    expect(r.reasons).toContain("recent_response");
  });

  it("rewards budget fitting an active listing", () => {
    const r = scoreLead({
      lead: { ...baseLead, budget_min: 2_000_000, budget_max: 3_000_000 },
      activeListings: [{ price: 2_500_000 }],
    });
    expect(r.reasons).toContain("budget_matches_listing");
    expect(r.value).toBe(20);
  });

  it("tier boundary: 40 is warm, 39 is cold", () => {
    const warm = scoreLead({
      lead: { ...baseLead, mortgage_approved: true, timeline: "1_3_months" },
      activeListings: [],
    });
    expect(warm.value).toBe(42);
    expect(warm.tier).toBe("warm");
  });
});
