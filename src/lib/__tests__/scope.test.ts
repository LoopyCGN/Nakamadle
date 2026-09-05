import { describe, expect, it } from "vitest";
import { DEFAULT_SCOPE, filterByScope, isScope, scopeFromParam } from "../scope";
import { CharactersSchema } from "../schema";
import type { Character } from "../schema";

const base: Character = {
  id: "a",
  names: { de: "A", en: "A", aliases: [] },
  gender: "male",
  affiliation: ["Straw Hat Pirates"],
  origin: { sea: "East Blue" },
  haki: [],
  fruitId: null,
  bounty: null,
  debut: { saga: "East Blue", arc: "Romance Dawn" },
  status: "alive",
  animeSafe: true,
  bountySource: "wg",
};

const spoiler: Character = { ...base, id: "spoiler", animeSafe: false };

describe("scope", () => {
  it("defaults to anime (spoiler-safe)", () => {
    expect(DEFAULT_SCOPE).toBe("anime");
    expect(scopeFromParam(undefined)).toBe("anime");
    expect(scopeFromParam("nonsense")).toBe("anime");
  });

  it("parses valid params (incl. arrays)", () => {
    expect(scopeFromParam("manga")).toBe("manga");
    expect(scopeFromParam(["anime"])).toBe("anime");
    expect(isScope("manga")).toBe(true);
    expect(isScope("endOfWano")).toBe(false);
  });

  it("manga scope keeps everything, anime hides flagged characters", () => {
    expect(filterByScope([base, spoiler], "manga")).toHaveLength(2);
    expect(filterByScope([base, spoiler], "anime")).toEqual([base]);
  });

  it("animeSafe defaults to true in schema", () => {
    const { animeSafe, ...rest } = base;
    void animeSafe;
    const parsed = CharactersSchema.parse([rest]);
    expect(parsed[0].animeSafe).toBe(true);
  });
});
