import { describe, expect, it } from "vitest";
import { berlinDateKey, dailyIndex, dayNumberFromKey, pickDaily } from "../daily";

describe("daily", () => {
  it("formats berlin date key", () => {
    // 2026-09-03 23:30 UTC == 2026-09-04 01:30 in Berlin (CEST)
    const d = new Date(Date.UTC(2026, 8, 3, 23, 30));
    expect(berlinDateKey(d)).toBe("2026-09-04");
  });

  it("is deterministic per date", () => {
    const pool = ["a", "b", "c", "d"];
    expect(pickDaily(pool, "2026-09-03")).toBe(pickDaily(pool, "2026-09-03"));
    expect(dailyIndex("2026-09-03", pool.length)).toBe(dayNumberFromKey("2026-09-03") % pool.length);
  });

  it("consecutive days usually differ (pool > 1)", () => {
    const pool = Array.from({ length: 29 }, (_, i) => `c${i}`);
    const a = pickDaily(pool, "2026-09-03");
    const b = pickDaily(pool, "2026-09-04");
    expect(a).not.toBe(b);
  });
});
