import { describe, expect, it } from "vitest";
import { applyDrafts, draftCount, emptyDrafts, isDraftId } from "../drafts";
import type { Character } from "../schema";

const base: Character = {
  id: "a",
  names: { de: "A", en: "A", aliases: [] },
  gender: "male",
  affiliation: ["Straw Hat Pirates"],
  origin: { sea: "East Blue" },
  haki: [],
  fruitId: null,
  bounty: 100,
  debut: { saga: "East Blue", arc: "Romance Dawn" },
  status: "alive",
  animeSafe: true,
};

const b: Character = { ...base, id: "b", names: { de: "B", en: "B", aliases: [] } };

describe("drafts", () => {
  it("returns base unchanged when empty", () => {
    expect(applyDrafts([base, b], emptyDrafts)).toEqual([base, b]);
    expect(draftCount(emptyDrafts)).toBe(0);
  });

  it("applies edited entries by id", () => {
    const edited = { ...base, bounty: 999 };
    const out = applyDrafts([base, b], { added: [], edited: { a: edited } });
    expect(out).toHaveLength(2);
    expect(out[0].bounty).toBe(999);
    expect(isDraftId({ added: [], edited: { a: edited } }, "a")).toBe(true);
    expect(isDraftId({ added: [], edited: { a: edited } }, "b")).toBe(false);
  });

  it("appends added entries without duplicating base ids", () => {
    const c: Character = { ...base, id: "c" };
    const out = applyDrafts([base], { added: [c, base], edited: {} });
    expect(out.map((x) => x.id)).toEqual(["a", "c"]);
  });

  it("counts added + edited", () => {
    expect(draftCount({ added: [b], edited: { a: base } })).toBe(2);
  });
});
