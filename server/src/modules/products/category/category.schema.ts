import { z } from "zod";

// ─── Create Category ──────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required").max(100),
    }),
});

// ─── Update Category ──────────────────────────────────────────────────────────

export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid category ID"),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
    }),
});

// ─── Category Params ──────────────────────────────────────────────────────────

export const categoryParamsSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid category ID"),
    }),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>["body"];