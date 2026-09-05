import { dicts, type Locale } from "./i18n";
import type { Character } from "./schema";

/** Berry display with source marker: ฿ = World Government, ⭐ = Cross Guild (Marines). */
export function formatBounty(bounty: Character["bounty"], source: Character["bountySource"], locale: Locale): string {
  if (bounty === null) return dicts[locale].noBounty;
  const n = new Intl.NumberFormat(locale).format(bounty);
  return source === "cross-guild" ? `⭐ ${n}` : `${n} ฿`;
}
