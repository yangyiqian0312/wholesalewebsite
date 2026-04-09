import { z } from "zod";

export const updateCatalogProductSchema = z.object({
  name: z.string().trim().min(1).optional(),
  unitPrice: z.number().nonnegative().nullable().optional(),
  releaseDate: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCatalogProductInput = z.infer<typeof updateCatalogProductSchema>;
