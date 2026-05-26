import prisma from "@/config/prisma.js";
import { AppError } from "@/utils/appError.js";
import { uploadImage, deleteImage } from "@/libs/cloudinary.js";
import slugify from "slugify";
import type {
    ListProductsDTO,
    CreateProductDTO,
    UpdateProductDTO,
    CreateVariantDTO,
    CreateReviewDTO,
} from "./products.schema.js";
import type {
    ProductSummaryDTO,
    ProductDetailDTO,
    PaginatedDTO,
    ReviewDTO,
} from "./products.types.js";
import { logger } from "@/libs/logger.js";

export class ProductService {

    // ─── List products ────────────────────────────────────────────────────────

    static async listProducts(dto: ListProductsDTO): Promise<PaginatedDTO<ProductSummaryDTO>> {
        const { page, limit, search, brandId, categoryId, minPrice, maxPrice, sortBy } = dto;
        const skip = (page - 1) * limit;

        const where = {
            isActive: true,
            deletedAt: null,
            ...(search && { name: { contains: search, mode: "insensitive" as const } }),
            ...(brandId && { brandId }),
            ...(categoryId && { categoryId }),
            ...(minPrice !== undefined || maxPrice !== undefined) && {
                price: {
                    ...(minPrice !== undefined && { gte: minPrice }),
                    ...(maxPrice !== undefined && { lte: maxPrice }),
                },
            },
        };

        const orderBy =
            sortBy === "price_asc" ? { price: "asc" as const }
            : sortBy === "price_desc" ? { price: "desc" as const }
            : sortBy === "rating" ? { averageRating: "desc" as const }
            : { createdAt: "desc" as const };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
                    category: { select: { id: true, name: true, slug: true } },
                    images: { where: { position: 0 }, take: 1, select: { url: true } },
                },
            }),
            prisma.product.count({ where }),
        ]);

        return {
            data: products.map(this.toSummaryDTO),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ─── Get product ──────────────────────────────────────────────────────────

    static async getProduct(slug: string): Promise<ProductDetailDTO> {
        const product = await prisma.product.findFirst({
            where: { slug, isActive: true, deletedAt: null },
            include: {
                brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
                category: { select: { id: true, name: true, slug: true } },
                images: { orderBy: { position: "asc" } },
                variants: { orderBy: { size: "asc" } },
            },
        });

        if (!product) throw new AppError("Product not found", 404);
        return this.toDetailDTO(product);
    }

    // ─── Create product ───────────────────────────────────────────────────────

    static async createProduct(dto: CreateProductDTO): Promise<ProductDetailDTO> {
        const slug = slugify(dto.name, { lower: true, strict: true });

        const existing = await prisma.product.findUnique({ where: { slug } });
        if (existing) throw new AppError("Product with this name already exists", 409);

        const product = await prisma.product.create({
            data: { ...dto, slug, price: dto.price },
            include: {
                brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
                category: { select: { id: true, name: true, slug: true } },
                images: true,
                variants: true,
            },
        });
        logger.info({ productId: product.id, event: "PRODUCT_ADDED" },"Product created")

        return this.toDetailDTO(product);
    }

    // ─── Update product ───────────────────────────────────────────────────────

    static async updateProduct(id: string, dto: UpdateProductDTO): Promise<ProductDetailDTO> {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new AppError("Product not found", 404);

        const updated = await prisma.product.update({
            where: { id },
            data: dto,
            include: {
                brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
                category: { select: { id: true, name: true, slug: true } },
                images: { orderBy: { position: "asc" } },
                variants: { orderBy: { size: "asc" } },
            },
        });

                logger.info({ productId: product.id, event: "PRODUCT_UPDATED" },"Product updated")

        return this.toDetailDTO(updated);
    }

    // ─── Delete product (soft) ────────────────────────────────────────────────

    static async deleteProduct(id: string): Promise<void> {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new AppError("Product not found", 404);

        await prisma.product.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
                logger.info({ productId: product.id, event: "PRODUCT_REMOVED" },"Product deleted")

    }

    // ─── Upload image ─────────────────────────────────────────────────────────

    static async uploadImage(
        productId: string,
        file: Express.Multer.File,
        altText?: string,
    ): Promise<void> {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new AppError("Product not found", 404);

        const lastImage = await prisma.productImage.findFirst({
            where: { productId },
            orderBy: { position: "desc" },
        });

        const { url } = await uploadImage(file.buffer, "sneakr/products");

        await prisma.productImage.create({
            data: {
                productId,
                url,
                altText: altText ?? null,
                position: lastImage ? lastImage.position + 1 : 0,
            },
        });

            logger.info({ productId : product.id , event: "Image Added" }, "Image Created");
        
    }

    // ─── Delete image ─────────────────────────────────────────────────────────

    static async deleteProductImage(imageId: string): Promise<void> {
        const image = await prisma.productImage.findUnique({ where: { id: imageId } });
        if (!image) throw new AppError("Image not found", 404);

        // Extract public_id from cloudinary url
        const publicId = image.url.split("/").slice(-2).join("/").split(".")[0];
        await deleteImage(`sneakr/products/${publicId}`);

        await prisma.productImage.delete({ where: { id: imageId } });
    }

    // ─── Create variant ───────────────────────────────────────────────────────

    static async createVariant(productId: string, dto: CreateVariantDTO) {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new AppError("Product not found", 404);

        const existing = await prisma.variant.findFirst({
            where: { productId, size: dto.size, colorName: dto.colorName ?? null },
        });
        if (existing) throw new AppError("Variant with this size and color already exists", 409);

        return prisma.variant.create({ data: { productId, ...dto } });
    }

    // ─── Get reviews ──────────────────────────────────────────────────────────

    static async getReviews(slug: string): Promise<ReviewDTO[]> {
        const product = await prisma.product.findFirst({ where: { slug } });
        if (!product) throw new AppError("Product not found", 404);

        const reviews = await prisma.review.findMany({
            where: { productId: product.id, isVisible: true },
            orderBy: { createdAt: "desc" },
        });

        return reviews.map((r) => ({
            id: r.id,
            userId: r.userId,
            rating: r.rating,
            title: r.title,
            body: r.body,
            isVerifiedPurchase: r.isVerifiedPurchase,
            createdAt: r.createdAt,
        }));
    }

    // ─── Create review ────────────────────────────────────────────────────────

    static async createReview(
        slug: string,
        userId: string,
        dto: CreateReviewDTO,
    ): Promise<ReviewDTO> {
        const product = await prisma.product.findFirst({
            where: { slug, isActive: true, deletedAt: null },
        });
        if (!product) throw new AppError("Product not found", 404);

        const existing = await prisma.review.findUnique({
            where: { userId_productId: { userId, productId: product.id } },
        });
        if (existing) throw new AppError("You have already reviewed this product", 409);

        // Check if verified purchase
        const purchase = await prisma.orderItem.findFirst({
            where: {
                productId: product.id,
                order: { userId, status: "DELIVERED" },
            },
        });

        const review = await prisma.review.create({
            data: {
                userId,
                productId: product.id,
                rating: dto.rating,
                title: dto.title ?? null,
                body: dto.body ?? null,
                isVerifiedPurchase: !!purchase,
            },
        });

        // Update average rating
        const { _avg } = await prisma.review.aggregate({
            where: { productId: product.id, isVisible: true },
            _avg: { rating: true },
        });

        await prisma.product.update({
            where: { id: product.id },
            data: { averageRating: _avg.rating },
        });

        return {
            id: review.id,
            userId: review.userId,
            rating: review.rating,
            title: review.title,
            body: review.body,
            isVerifiedPurchase: review.isVerifiedPurchase,
            createdAt: review.createdAt,
        };
    }

    // ─── DTOs ─────────────────────────────────────────────────────────────────

    private static toSummaryDTO(product: any): ProductSummaryDTO {
        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: Number(product.price),
            averageRating: product.averageRating,
            image: product.images?.[0]?.url ?? null,
            brand: product.brand,
            category: product.category,
        };
    }

    private static toDetailDTO(product: any): ProductDetailDTO {
        return {
            ...ProductService.toSummaryDTO(product),
            description: product.description,
            sku: product.sku,
            images: product.images.map((img: any) => ({
                id: img.id,
                url: img.url,
                altText: img.altText,
                position: img.position,
            })),
            variants: product.variants.map((v: any) => ({
                id: v.id,
                size: v.size,
                colorName: v.colorName,
                colorHex: v.colorHex,
                stock: v.stock,
                sku: v.sku,
            })),
        };
    }
}