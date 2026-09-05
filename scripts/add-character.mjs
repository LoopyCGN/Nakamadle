#!/usr/bin/env node
/**
 * Interactive helper to append a character to data/characters.json.
 * Usage: npm run add-character
 * Afterwards run: npm run validate
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const charsPath = join(root, "data", "characters.json");
const fruitsPath = join(root, "data", "fruits.json");

const characters = JSON.parse(readFileSync(charsPath, "utf8"));
const fruits = JSON.parse(readFileSync(fruitsPath, "utf8"));
const fruitIds = new Set(fruits.map((f) => f.id));
const knownAffiliations = [...new Set(characters.flatMap((c) => c.affiliation))].sort();
const knownSeas = [...new Set(characters.map((c) => c.origin.sea))].sort();

const rl = createInterface({ input: stdin, output: stdout });

async function ask(question, { validate, transform } = {}) {
  for (;;) {
    const raw = (await rl.question(question)).trim();
    const value = transform ? transform(raw) : raw;
    if (!validate) return value;
    const err = validate(value, raw);
    if (err) {
      console.log(`  ↳ ${err}, bitte erneut.`);
      continue;
    }
    return value;
  }
}

const splitList = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
const isKebab = (s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

console.log("\n=== Neuer Charakter ===\n");

const id = await ask("ID (kebab-case, z. B. nekomamushi): ", {
  validate: (v) =>
    !v ? "leer" : !isKebab(v) ? "nur Kleinbuchstaben/Zahlen/Bindestriche" : characters.some((c) => c.id === v) ? "ID existiert bereits" : null,
});
const de = await ask("Name (DE): ", { validate: (v) => (!v ? "leer" : null) });
const en = await ask("Name (EN): ", { validate: (v) => (!v ? "leer" : null) });
const aliases = await ask("Aliasse (kommagetrennt, leer = keine): ", { transform: splitList });
const gender = await ask("Geschlecht (male/female): ", {
  validate: (v) => (v !== "male" && v !== "female" ? "male oder female" : null),
});
console.log(`Bekannte Zugehörigkeiten: ${knownAffiliations.join(", ")}`);
const affiliation = await ask("Zugehörigkeit (kommagetrennt, mind. 1): ", {
  transform: splitList,
  validate: (v) => (v.length === 0 ? "mind. 1 nötig" : null),
});
console.log(`Bekannte Meere: ${knownSeas.join(", ")}`);
const sea = await ask("Meer (z. B. East Blue): ", { validate: (v) => (!v ? "leer" : null) });
const place = await ask("Ort/Insel (leer = unbekannt): ");
const haki = await ask("Haki (kommagetrennt aus armament,observation,conqueror — leer = keins): ", {
  transform: splitList,
  validate: (v) => (v.some((h) => !["armament", "observation", "conqueror"].includes(h)) ? "nur armament/observation/conqueror" : null),
});
console.log(`Bekannte Früchte: ${[...fruitIds].join(", ")}`);
const fruitId = await ask("Frucht-ID (leer = keine): ", {
  transform: (s) => (s === "" ? null : s),
  validate: (v) => (v !== null && !fruitIds.has(v) ? "unbekannte Frucht-ID" : null),
});
const bounty = await ask("Kopfgeld in Berry (leer = keins): ", {
  transform: (s) => (s === "" ? null : Number(s)),
  validate: (v) => (v !== null && (!Number.isInteger(v) || v < 0) ? "ganze Zahl ≥ 0" : null),
});
const bountySourceAnswer = bounty === null ? "wg" : await ask("Kopfgeld-Quelle (wg/cross-guild, Standard wg): ");
const bountySource = bountySourceAnswer === "cross-guild" ? "cross-guild" : "wg";
const saga = await ask("Debüt-Saga (z. B. East Blue): ", { validate: (v) => (!v ? "leer" : null) });
const arc = await ask("Debüt-Arc (z. B. Romance Dawn): ", { validate: (v) => (!v ? "leer" : null) });
const status = await ask("Status (alive/deceased/unknown): ", {
  validate: (v) => (!["alive", "deceased", "unknown"].includes(v) ? "alive, deceased oder unknown" : null),
});
const animeAnswer = await ask("Bereits im Anime zu sehen? (y/n, Standard y): ");
const animeSafe = animeAnswer.toLowerCase() !== "n";

const entry = {
  id,
  names: { de, en, aliases },
  gender,
  affiliation,
  origin: place ? { sea, place } : { sea },
  haki,
  fruitId,
  bounty,
  bountySource,
  debut: { saga, arc },
  status,
  animeSafe,
};

console.log("\n--- Eintrag ---");
console.log(JSON.stringify(entry, null, 2));
const ok = await ask("\nAnhängen? (y/n): ");
await rl.close();

if (ok.toLowerCase() !== "y") {
  console.log("Abgebrochen.");
  process.exit(0);
}

characters.push(entry);
writeFileSync(charsPath, JSON.stringify(characters, null, 2) + "\n");
console.log(`\n✅ ${id} angehängt. Jetzt prüfen mit: npm run validate`);
