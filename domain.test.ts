import { describe, expect, it } from "vitest";
import { scoreCompleteness, matchReasons } from "./services/domain.service";

describe("domain", () => {
  it("scores empty profile low with tips", () => {
    const r = scoreCompleteness({});
    expect(r.pct).toBeLessThan(40);
    expect(r.tips.length).toBeGreaterThan(0);
  });
  it("explains matches", () => {
    const r = matchReasons({ disciplines: ["Painting"] }, { disciplines: ["Painting"], goal: "FIRST_SALE" });
    expect(r.join(" ")).toMatch(/discipline/i);
  });
});
