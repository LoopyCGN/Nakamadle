import type { Character } from "./schema";

export type CellStatus =
  | "correct"
  | "partial"
  | "wrong"
  | "higher" // guess bounty lower than target -> arrow up
  | "lower"; // guess bounty higher than target -> arrow down

export interface ComparedField {
  key: string;
  status: CellStatus;
}

function setEquals(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

function setOverlap(a: readonly string[], b: readonly string[]): boolean {
  const sb = new Set(b);
  return a.some((x) => sb.has(x));
}

export function compareGuess(
  guess: Character,
  target: Character,
  fruitTypeOf: (c: Character) => string, // "none" or FruitType
): ComparedField[] {
  const out: ComparedField[] = [];

  out.push({ key: "gender", status: guess.gender === target.gender ? "correct" : "wrong" });

  out.push({
    key: "affiliation",
    status: setEquals(guess.affiliation, target.affiliation)
      ? "correct"
      : setOverlap(guess.affiliation, target.affiliation)
        ? "partial"
        : "wrong",
  });

  // Correct when sea AND place match (missing place on both sides counts as equal,
  // so the exact character always shows green). Same sea, different place → partial.
  const sameSea = guess.origin.sea === target.origin.sea;
  const samePlace = guess.origin.place === target.origin.place;
  out.push({
    key: "origin",
    status: sameSea && samePlace ? "correct" : sameSea ? "partial" : "wrong",
  });

  out.push({
    key: "haki",
    status:
      guess.haki.length === 0 && target.haki.length === 0
        ? "correct"
        : setEquals(guess.haki, target.haki)
          ? "correct"
          : setOverlap(guess.haki, target.haki)
            ? "partial"
            : "wrong",
  });

  const gFruit = fruitTypeOf(guess);
  const tFruit = fruitTypeOf(target);
  out.push({ key: "fruit", status: gFruit === tFruit ? "correct" : "wrong" });

  if (guess.bounty === null && target.bounty === null) {
    out.push({ key: "bounty", status: "correct" });
  } else if (guess.bounty === null || target.bounty === null) {
    out.push({ key: "bounty", status: "wrong" });
  } else if (guess.bounty === target.bounty) {
    out.push({ key: "bounty", status: "correct" });
  } else {
    out.push({ key: "bounty", status: guess.bounty < target.bounty ? "higher" : "lower" });
  }

  out.push({
    key: "debut",
    status:
      guess.debut.arc === target.debut.arc
        ? "correct"
        : guess.debut.saga === target.debut.saga
          ? "partial"
          : "wrong",
  });

  out.push({ key: "status", status: guess.status === target.status ? "correct" : "wrong" });

  return out;
}
