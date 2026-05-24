import prisma from "@/config/prisma.js";
import { AppError } from "@/utils/appError.js";
import type { CreateReviewDTO, UpdateReviewDTO } from "./reviews.schema.js";

export interface ReviewDTO {
    id: string;
    userId: string;
    productId: string;
    rating: number;
    title: string | null;
    body: string | null;
    isVerifiedPurchase: boolean;
    isVisible: boolean;
    createdAt: Date;
}

export class ReviewService {

    // ─── Get reviews for a product ────────────────────────────────────────────

    static async getReviews(slug: string): Promise<ReviewDTO[]> {
        const product = await prisma.product.findFirst({
            where: { slug, isActive: true, deletedAt: null },
        });
        if (!product) throw new AppError("Product not found", 404);

        const reviews = await prisma.review.findMany({
            where: { productId: product.id, isVisible: true },
            orderBy: { createdAt: "desc" },
        });

        return reviews.map(this.toDTO);
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

        // Recalculate average rating
        await ReviewService.recalculateRating(product.id);

        return this.toDTO(review);
    }

    // ─── Update review visibility (admin) ─────────────────────────────────────

    static async updateReview(id: string, dto: UpdateReviewDTO): Promise<ReviewDTO> {
        const review = await prisma.review.findUnique({ where: { id } });
        if (!review) throw new AppError("Review not found", 404);

        const updated = await prisma.review.update({
            where: { id },
            data: { isVisible: dto.isVisible },
        });

        // Recalculate rating after visibility change
        await ReviewService.recalculateRating(review.productId);

        return this.toDTO(updated);
    }

    // ─── Delete review (admin) ────────────────────────────────────────────────

    static async deleteReview(id: string): Promise<void> {
        const review = await prisma.review.findUnique({ where: { id } });
        if (!review) throw new AppError("Review not found", 404);

        await prisma.review.delete({ where: { id } });

        // Recalculate rating after deletion
        await ReviewService.recalculateRating(review.productId);
    }

    // ─── Recalculate average rating ───────────────────────────────────────────

    private static async recalculateRating(productId: string): Promise<void> {
        const { _avg } = await prisma.review.aggregate({
            where: { productId, isVisible: true },
            _avg: { rating: true },
        });

        await prisma.product.update({
            where: { id: productId },
            data: { averageRating: _avg.rating ?? null },
        });
    }

    // ─── DTO ──────────────────────────────────────────────────────────────────

    private static toDTO(review: any): ReviewDTO {
        return {
            id: review.id,
            userId: review.userId,
            productId: review.productId,
            rating: review.rating,
            title: review.title,
            body: review.body,
            isVerifiedPurchase: review.isVerifiedPurchase,
            isVisible: review.isVisible,
            createdAt: review.createdAt,
        };
    }
}
