import { z } from "zod";

export const ChaussureCategorieSchema = z.enum([
  "FEMME",
  "HOMME",
  "ENFANT",
  "SPORT",
  "SANDALES",
  "BOTTES",
  "ESCARPINS",
  "SNEAKERS",
  "ACCESSOIRES",
]);

export const SourceImportSchema = z.enum(["MANUEL", "CSV", "API"]);

export const CreateChaussureSchema = z.object({
  reference: z.string().min(1).max(100),
  nom: z.string().min(2).max(200),
  marque: z.string().max(100).optional(),
  categorie: ChaussureCategorieSchema,
  couleur: z.string().max(100).optional(),
  pointuresDisponibles: z.array(z.string()).default([]),
  prix: z.number().positive("Le prix doit être positif"),
  prixPromo: z.number().positive().optional().nullable(),
  stockTotal: z.number().int().min(0).default(0),
  stocksParPointure: z.record(z.string(), z.number().int().min(0)).default({}),
  description: z.string().max(3000).optional(),
  images: z.array(z.string().url()).default([]),
  fournisseurRef: z.string().max(200).optional(),
  actif: z.boolean().default(true),
  featured: z.boolean().default(false),
  sourceImport: SourceImportSchema.default("MANUEL"),
});

export const UpdateChaussureSchema = CreateChaussureSchema.partial();

export const ChaussureFiltresSchema = z.object({
  categorie: ChaussureCategorieSchema.optional(),
  marque: z.string().optional(),
  couleur: z.string().optional(),
  pointure: z.string().optional(),
  prixMin: z.coerce.number().optional(),
  prixMax: z.coerce.number().optional(),
  promo: z.string().transform((v) => v === "true").optional(),
  featured: z.string().transform((v) => v === "true").optional(),
  actif: z.string().transform((v) => v === "true").optional(),
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["pertinence", "prix_asc", "prix_desc", "nouveautes"]).default("pertinence"),
});

export type CreateChaussureInput = z.infer<typeof CreateChaussureSchema>;
export type ChaussureFiltres = z.infer<typeof ChaussureFiltresSchema>;
