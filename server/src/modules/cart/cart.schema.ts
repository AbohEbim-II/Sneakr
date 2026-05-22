import {z} from "zod"

export const addCartItemSchema = z.object({
    body: z.object({
        productId: z.uuid("Invalid product ID"),
        variantId: z.uuid("Invalid variant ID"),
        quantity: z.number().min(1, "Quantity must be at least one").default(1)
    }),
})

export const updateCartItemSchema = z.object({
    params: z.object({
        itemId: z.coerce.number().int().positive("Invalid item ID"),
    }),
    body: z.object({
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
    }),
});

// ─── Remove Item ──────────────────────────────────────────────────────────────

export const removeCartItemSchema = z.object({
    params: z.object({
        itemId: z.coerce.number().int().positive("Invalid item ID"),
    }),
});

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export type AddCartItemDTO = z.infer<typeof addCartItemSchema>["body"];
export type UpdateCartItemDTO = z.infer<typeof updateCartItemSchema>["body"];
export type RemoveCartItemDTO = z.infer<typeof removeCartItemSchema>["params"];