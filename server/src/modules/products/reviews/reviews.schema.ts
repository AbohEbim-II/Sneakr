import { z } from "zod";

// ─── Create Review ────────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
    params: z.object({
        slug: z.string().min(1, "Product slug is required"),
    }),
    body: z.object({
        rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
        title: z.string().min(1).max(150).optional(),
        body: z.string().min(1).max(2000).optional(),
    }),
});

// ─── Update Review (admin: toggle visibility) ─────────────────────────────────

export const updateReviewSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid review ID"),
    }),
    body: z.object({
        isVisible: z.boolean(),
    }),
});

// ─── Review Params ────────────────────────────────────────────────────────────

export const reviewParamsSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid review ID"),
    }),
});

export const reviewSlugParamsSchema = z.object({
    params: z.object({
        slug: z.string().min(1),
    }),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateReviewDTO = z.infer<typeof createReviewSchema>["body"];
export type UpdateReviewDTO = z.infer<typeof updateReviewSchema>["body"];
