import charactersJson from "../../data/characters.json";
import fruitsJson from "../../data/fruits.json";
import {
  CharactersSchema,
  FruitsSchema,
  type Character,
  type Fruit,
} from "./schema";

function parse<T>(fn: () => T): T {
  return fn();
}

export const characters: Character[] = parse(() => CharactersSchema.parse(charactersJson));

export const fruits: Fruit[] = parse(() => FruitsSchema.parse(fruitsJson));

export const charactersById: Map<string, Character> = new Map(characters.map((c) => [c.id, c]));

export const fruitsById: Map<string, Fruit> = new Map(fruits.map((f) => [f.id, f]));

/** Characters sorted by id — stable order used as the daily pool. Append-only: never reorder. */
export const dailyPool: Character[] = [...characters].sort((a, b) => a.id.localeCompare(b.id));

/** Characters that have a devil fruit — pool for the fruit mode. */
export const fruitPool: Character[] = dailyPool.filter((c) => c.fruitId !== null);

export function assertReferentialIntegrity(): string[] {
  const errors: string[] = [];
  for (const c of characters) {
    if (c.fruitId !== null && !fruitsById.has(c.fruitId)) {
      errors.push(`character ${c.id} references unknown fruit ${c.fruitId}`);
    }
  }
  const ids = new Set<string>();
  for (const c of characters) {
    if (ids.has(c.id)) errors.push(`duplicate character id ${c.id}`);
    ids.add(c.id);
  }
  return errors;
}
