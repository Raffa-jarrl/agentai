import { describe, expect, it } from "vitest";
import { matchLeadToListing } from "./listingMatch";

const lead = {
  budget_min: 2_000_000,
  budget_max: 3_000_000,
  preferred_rooms: 4,
  preferred_areas: ["תל אביב", "רמת אביב"],
  mortgage_approved: true,
};

describe("matchLeadToListing", () => {
  it("full match returns 100", () => {
    const r = matchLeadToListing(lead, { price: 2_500_000, rooms: 4, city: "תל אביב", neighborhood: "רמת אביב" });
    expect(r.score).toBe(100);
    expect(r.reasons).toEqual(expect.arrayContaining(["budget_match", "area_match", "rooms_match", "mortgage_approved"]));
  });

  it("out of budget range gives partial credit when close", () => {
    const r = matchLeadToListing(lead, { price: 3_200_000, rooms: 4, city: "תל אביב", neighborhood: null });
    expect(r.reasons).toContain("budget_close");
    expect(r.score).toBe(20 + 30 + 20 + 10);
  });

  it("no overlap returns only mortgage credit", () => {
    const r = matchLeadToListing(lead, { price: 5_000_000, rooms: 2, city: "חיפה", neighborhood: null });
    expect(r.score).toBe(10);
    expect(r.reasons).toEqual(["mortgage_approved"]);
  });

  it("room tolerance within 0.5 counts", () => {
    const r = matchLeadToListing(lead, { price: 2_500_000, rooms: 4.5, city: "תל אביב", neighborhood: null });
    expect(r.reasons).toContain("rooms_match");
  });
});
