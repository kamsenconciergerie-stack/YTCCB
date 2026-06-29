import { z } from "zod";

export const ProductCategorySchema = z.enum([
  "ESCARPINS",
  "SANDALES",
  "BOTTES",
  "MULES",
  "BALLERINES",
  "BASKETS",
  "MOCASSINS",
  "COMPENSEES",
]);

export const CreateProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug : lettres minuscules, chiffres et tirets uniquement"),
  description: z.string().max(2000).optional(),
  category: ProductCategorySchema,
  price: z.number().positive("Le prix doit être positif"),
  stockQty: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  unit: z.string().min(1).max(50).default("unité"),
  sku: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductFiltersSchema = z.object({
  category: ProductCategorySchema.optional(),
  isActive: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type ProductFilters = z.infer<typeof ProductFiltersSchema>;
