import { z } from "zod";

// ─── Create Brand ─────────────────────────────────────────────────────────────

export const createBrandSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required").max(100),
        logoUrl: z.string().url("Invalid logo URL").optional(),
    }),
});

// ─── Update Brand ─────────────────────────────────────────────────────────────

export const updateBrandSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid brand ID"),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        logoUrl: z.string().url("Invalid logo URL").nullable().optional(),
    }),
});

// ─── Brand Params ─────────────────────────────────────────────────────────────

export const brandParamsSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid brand ID"),
    }),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateBrandDTO = z.infer<typeof createBrandSchema>["body"];
export type UpdateBrandDTO = z.infer<typeof updateBrandSchema>["body"];
