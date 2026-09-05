import { describe, expect, it } from "vitest";
import { compareGuess } from "../compare";
import type { Character } from "../schema";

const base: Character = {
  id: "a",
  names: { de: "A", en: "A", aliases: [] },
  gender: "male",
  affiliation: ["Straw Hat Pirates"],
  origin: { sea: "East Blue", place: "Windmill Village" },
  haki: ["armament", "observation"],
  fruitId: "gomu-gomu",
  bounty: 1000,
  debut: { saga: "East Blue", arc: "Romance Dawn" },
  status: "alive",
  animeSafe: true,
  bountySource: "wg",
};

const fruitTypeOf = (c: Character) => (c.fruitId === null ? "none" : c.fruitId === "gomu-gomu" ? "zoan" : "logia");

describe("compareGuess", () => {
  it("marks identical characters correct", () => {
    const res = compareGuess(base, base, fruitTypeOf);
    for (const f of res) expect(f.status).toBe("correct");
  });

  it("detects partial affiliation and origin", () => {
    const guess: Character = {
      ...base,
      affiliation: ["Straw Hat Pirates", "Alabasta Kingdom"],
      origin: { sea: "East Blue", place: "Goa Kingdom" },
    };
    const res = compareGuess(guess, base, fruitTypeOf);
    expect(res.find((f) => f.key === "affiliation")?.status).toBe("partial");
    expect(res.find((f) => f.key === "origin")?.status).toBe("partial");
  });

  it("shows fruit and debut hints immediately (no unlock threshold)", () => {
    const other: Character = {
      ...base,
      fruitId: "yami-yami",
      debut: { saga: "Skypiea", arc: "Jaya" },
    };
    const res = compareGuess(other, base, fruitTypeOf);
    expect(res.find((f) => f.key === "fruit")?.status).toBe("wrong");
    expect(res.find((f) => f.key === "debut")?.status).toBe("wrong");
    expect(res.map((f) => f.key)).toContain("fruit");
    expect(res.map((f) => f.key)).toContain("debut");
  });

  it("gives bounty direction hints", () => {
    const low = { ...base, bounty: 500 };
    const high = { ...base, bounty: 2000 };
    expect(compareGuess(low, base, fruitTypeOf).find((f) => f.key === "bounty")?.status).toBe("higher");
    expect(compareGuess(high, base, fruitTypeOf).find((f) => f.key === "bounty")?.status).toBe("lower");
  });

  it("both null bounties count as correct", () => {
    const a = { ...base, bounty: null };
    const res = compareGuess(a, a, fruitTypeOf);
    expect(res.find((f) => f.key === "bounty")?.status).toBe("correct");
  });

  it("origin without place is correct for the exact character (e.g. Linlin)", () => {
    const linlin: Character = {
      ...base,
      id: "charlotte-linlin",
      origin: { sea: "New World" },
    };
    const res = compareGuess(linlin, linlin, fruitTypeOf);
    expect(res.find((f) => f.key === "origin")?.status).toBe("correct");
    for (const f of res) expect(f.status).toBe("correct");
  });

  it("same sea but different place stays partial", () => {
    const guess: Character = { ...base, origin: { sea: "East Blue", place: "Goa Kingdom" } };
    const target: Character = { ...base, origin: { sea: "East Blue", place: "Windmill Village" } };
    expect(compareGuess(guess, target, fruitTypeOf).find((f) => f.key === "origin")?.status).toBe("partial");
  });
});
