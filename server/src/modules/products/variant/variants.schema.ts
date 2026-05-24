import { z } from "zod";

// ─── Create Variant ───────────────────────────────────────────────────────────

export const createVariantSchema = z.object({
    params: z.object({
        productId: z.string().uuid("Invalid product ID"),
    }),
    body: z.object({
        size: z.string().min(1, "Size is required"),
        colorName: z.string().min(1).optional(),
        colorHex: z
            .string()
            .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color")
            .optional(),
        stock: z.number().int().min(0).default(0),
        sku: z.string().min(1).optional(),
    }),
});

// ─── Update Variant ───────────────────────────────────────────────────────────

export const updateVariantSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid variant ID"),
    }),
    body: z.object({
        size: z.string().min(1).optional(),
        colorName: z.string().min(1).nullable().optional(),
        colorHex: z
            .string()
            .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color")
            .nullable()
            .optional(),
        stock: z.number().int().min(0).optional(),
        sku: z.string().min(1).nullable().optional(),
    }),
});

// ─── Variant Params ───────────────────────────────────────────────────────────

export const variantParamsSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid variant ID"),
    }),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateVariantDTO = z.infer<typeof createVariantSchema>["body"];
export type UpdateVariantDTO = z.infer<typeof updateVariantSchema>["body"];
