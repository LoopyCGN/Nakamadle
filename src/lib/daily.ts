/** Daily puzzle logic. Timezone: Europe/Berlin, reset at midnight. */

export function berlinDateKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function dayNumberFromKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Deterministic pick: index = dayNumber % poolSize. Pool must be append-only / stable-sorted. */
export function dailyIndex(dateKey: string, poolSize: number): number {
  if (poolSize <= 0) throw new Error("poolSize must be > 0");
  const n = dayNumberFromKey(dateKey);
  return ((n % poolSize) + poolSize) % poolSize;
}

export function pickDaily<T>(pool: readonly T[], dateKey: string): T {
  return pool[dailyIndex(dateKey, pool.length)];
}
