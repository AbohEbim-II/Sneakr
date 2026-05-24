import { z } from "zod";

export const listProductsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        brandId: z.uuid().optional(),
        categoryId: z.uuid().optional(),
        minPrice: z.coerce.number().min(0).optional(),
        maxPrice: z.coerce.number().min(0).optional(),
        sortBy: z.enum(["price_asc", "price_desc", "newest", "rating"]).default("newest"),
    }),
});

export const getProductSchema = z.object({
    params: z.object({
        slug: z.string().min(1),
    }),
});

export const createProductSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        sku: z.string().optional(),
        price: z.coerce.number().min(0),
        brandId: z.uuid(),
        categoryId: z.uuid(),
    }),
});

export const updateProductSchema = z.object({
    params: z.object({ id: z.uuid() }),
    body: z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.coerce.number().min(0).optional(),
        isActive: z.boolean().optional(),
        brandId: z.string().optional(),
        categoryId: z.string().optional(),
    }),
});

export const createVariantSchema = z.object({
    params: z.object({ id: z.uuid() }),
    body: z.object({
        size: z.string().min(1),
        colorName: z.string().optional(),
        colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        stock: z.coerce.number().int().min(0).default(0),
        sku: z.string().optional(),
    }),
});

export const createReviewSchema = z.object({
    params: z.object({ slug: z.string().min(1) }),
    body: z.object({
        rating: z.number().int().min(1).max(5),
        title: z.string().max(100).optional(),
        body: z.string().max(1000).optional(),
    }),
});

export type ListProductsDTO = z.infer<typeof listProductsSchema>["query"];
export type CreateProductDTO = z.infer<typeof createProductSchema>["body"];
export type UpdateProductDTO = z.infer<typeof updateProductSchema>["body"];
export type CreateVariantDTO = z.infer<typeof createVariantSchema>["body"];
export type CreateReviewDTO = z.infer<typeof createReviewSchema>["body"];