import { describe, expect, it } from "vitest";
import { formatBounty } from "../format";

describe("formatBounty", () => {
  it("marks WG bounties with ฿", () => {
    expect(formatBounty(3000000000, "wg", "de")).toBe("3.000.000.000 ฿");
    expect(formatBounty(3000000000, "wg", "en")).toBe("3,000,000,000 ฿");
  });

  it("marks Cross Guild bounties with ⭐", () => {
    expect(formatBounty(500000000, "cross-guild", "de")).toBe("⭐ 500.000.000");
  });

  it("shows dash for none", () => {
    expect(formatBounty(null, "wg", "de")).toBe("–");
    expect(formatBounty(null, "cross-guild", "en")).toBe("–");
  });
});
