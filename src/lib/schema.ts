import { z } from "zod";

export const GenderSchema = z.enum(["male", "female", "unknown"]);
export const HakiSchema = z.enum(["armament", "observation", "conqueror"]);
export const FruitTypeSchema = z.enum(["paramecia", "logia", "zoan"]);
export const StatusSchema = z.enum(["alive", "deceased", "unknown"]);

export const CharacterSchema = z.object({
  id: z.string().min(1),
  names: z.object({
    de: z.string().min(1),
    en: z.string().min(1),
    aliases: z.array(z.string()).default([]),
  }),
  gender: GenderSchema,
  affiliation: z.array(z.string().min(1)).min(1),
  origin: z.object({
    sea: z.string().min(1),
    place: z.string().min(1).optional(),
  }),
  haki: z.array(HakiSchema),
  fruitId: z.string().min(1).nullable(),
  bounty: z.number().int().nonnegative().nullable(),
  /** wg = classic Berry bounty; cross-guild = star/crown bounty on Marines (berry equivalent). */
  bountySource: z.enum(["wg", "cross-guild"]).default("wg"),
  debut: z.object({
    saga: z.string().min(1),
    arc: z.string().min(1),
  }),
  status: StatusSchema,
  /** False for manga-only reveals (e.g. late Elbaph content). Defaults to true. */
  animeSafe: z.boolean().default(true),
});

export const FruitSchema = z.object({
  id: z.string().min(1),
  names: z.object({
    de: z.string().min(1),
    en: z.string().min(1),
    aliases: z.array(z.string()).default([]),
  }),
  type: FruitTypeSchema,
});

export const CharactersSchema = z.array(CharacterSchema);
export const FruitsSchema = z.array(FruitSchema);

export type Character = z.infer<typeof CharacterSchema>;
export type Fruit = z.infer<typeof FruitSchema>;
export type Gender = z.infer<typeof GenderSchema>;
export type Haki = z.infer<typeof HakiSchema>;
export type FruitType = z.infer<typeof FruitTypeSchema>;
export type Status = z.infer<typeof StatusSchema>;
