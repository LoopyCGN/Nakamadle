import { describe, expect, it } from "vitest";
import { isValidUsername } from "../auth";

describe("isValidUsername", () => {
  it("accepts 3-16 letters, numbers, underscores", () => {
    expect(isValidUsername("strohhut_99")).toBe(true);
    expect(isValidUsername("abc")).toBe(true);
    expect(isValidUsername("A".repeat(16))).toBe(true);
  });

  it("rejects the rest", () => {
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("A".repeat(17))).toBe(false);
    expect(isValidUsername("rühr-mich-an")).toBe(false);
    expect(isValidUsername("with space")).toBe(false);
    expect(isValidUsername("")).toBe(false);
  });
});
