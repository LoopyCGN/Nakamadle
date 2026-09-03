import type { Character } from "./schema";

export const DRAFTS_KEY = "opd:roster:drafts";

export interface RosterDrafts {
  added: Character[];
  edited: Record<string, Character>;
}

export const emptyDrafts: RosterDrafts = { added: [], edited: {} };

/** Merge base pool with local drafts. Edited entries replace by id, added ones append. */
export function applyDrafts(base: Character[], drafts: RosterDrafts): Character[] {
  const merged = base.map((c) => drafts.edited[c.id] ?? c);
  const baseIds = new Set(base.map((c) => c.id));
  for (const c of drafts.added) {
    if (!baseIds.has(c.id) && !merged.some((m) => m.id === c.id)) merged.push(c);
  }
  return merged;
}

export function draftCount(drafts: RosterDrafts): number {
  return drafts.added.length + Object.keys(drafts.edited).length;
}

export function isDraftId(drafts: RosterDrafts, id: string): boolean {
  return drafts.added.some((c) => c.id === id) || id in drafts.edited;
}
