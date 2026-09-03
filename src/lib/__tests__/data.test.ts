import { describe, expect, it } from "vitest";
import charactersJson from "../../../data/characters.json";
import fruitsJson from "../../../data/fruits.json";
import { CharactersSchema, FruitsSchema } from "../schema";
import { assertReferentialIntegrity } from "../data";

describe("game data", () => {
  it("characters.json matches schema", () => {
    const parsed = CharactersSchema.safeParse(charactersJson);
    if (!parsed.success) console.error(JSON.stringify(parsed.error.format(), null, 2));
    expect(parsed.success).toBe(true);
  });

  it("fruits.json matches schema", () => {
    expect(FruitsSchema.safeParse(fruitsJson).success).toBe(true);
  });

  it("has no dangling fruit references or duplicate ids", () => {
    expect(assertReferentialIntegrity()).toEqual([]);
  });

  it("has a reasonable pool size", () => {
    expect(charactersJson.length).toBeGreaterThanOrEqual(20);
  });
});
