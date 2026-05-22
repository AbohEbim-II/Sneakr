import prisma from "@/config/prisma.js";
import { AppError } from "@/utils/appError.js";
import type { AddCartItemDTO, UpdateCartItemDTO } from "./cart.schema.js";
import type { CartResponseDTO } from "./cart.types.js";

export class CartService {

    // ─── Get or create cart ───────────────────────────────────────────────────

    private static async getOrCreateCart(userId: string) {
        return prisma.cart.upsert({
            where: { userId },
            create: { userId },
            update: {},
        });
    }

    // ─── Get cart ─────────────────────────────────────────────────────────────

    static async getCart(userId: string): Promise<CartResponseDTO> {
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                slug: true,
                                images: {
                                    where: { position: 0 },
                                    take: 1,
                                    select: { url: true },
                                },
                            },
                        },
                        variant: {
                            select: {
                                size: true,
                                colorName: true,
                                colorHex: true,
                                stock: true,
                            },
                        },
                    },
                    orderBy: { addedAt: "asc" },
                },
            },
        });

        if (!cart) return { id: 0, items: [], itemCount: 0, subtotal: 0 };

        return this.toDTO(cart);
    }

    // ─── Add item ─────────────────────────────────────────────────────────────

    static async addItem(userId: string, dto: AddCartItemDTO): Promise<CartResponseDTO> {
        const cart = await this.getOrCreateCart(userId);

        // Validate product exists and is active
        const product = await prisma.product.findFirst({
            where: { id: dto.productId, isActive: true, deletedAt: null },
        });
        if (!product) throw new AppError("Product not found", 404);

        // Validate variant if provided
        if (dto.variantId) {
            const variant = await prisma.variant.findFirst({
                where: { id: dto.variantId, productId: dto.productId },
            });
            if (!variant) throw new AppError("Variant not found", 404);
            if (variant.stock < (dto.quantity ?? 1)) {
                throw new AppError("Insufficient stock", 400);
            }
        }

        // Upsert cart item — increment quantity if already exists
        await prisma.cartItem.upsert({
            where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
            create: {
                cartId: cart.id,
                productId: dto.productId,
                variantId: dto.variantId ?? null,
                quantity: dto.quantity ?? 1,
                unitPrice: product.price,
            },
            update: {
                quantity: { increment: dto.quantity ?? 1 },
            },
        });

        return this.getCart(userId);
    }

    // ─── Update item ──────────────────────────────────────────────────────────

    static async updateItem(
        userId: string,
        itemId: number,
        dto: UpdateCartItemDTO,
    ): Promise<CartResponseDTO> {
        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) throw new AppError("Cart not found", 404);

        const item = await prisma.cartItem.findFirst({
            where: { id: itemId, cartId: cart.id },
        });
        if (!item) throw new AppError("Cart item not found", 404);

        // Check stock if variant is attached
        if (item.variantId) {
            const variant = await prisma.variant.findUnique({ where: { id: item.variantId } });
            if (variant && variant.stock < dto.quantity) {
                throw new AppError("Insufficient stock", 400);
            }
        }

        await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: dto.quantity },
        });

        return this.getCart(userId);
    }

    // ─── Remove item ──────────────────────────────────────────────────────────

    static async removeItem(userId: string, itemId: number): Promise<CartResponseDTO> {
        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) throw new AppError("Cart not found", 404);

        const item = await prisma.cartItem.findFirst({
            where: { id: itemId, cartId: cart.id },
        });
        if (!item) throw new AppError("Cart item not found", 404);

        await prisma.cartItem.delete({ where: { id: itemId } });

        return this.getCart(userId);
    }

    // ─── Clear cart ───────────────────────────────────────────────────────────

    static async clearCart(userId: string): Promise<void> {
        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) return;

        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    // ─── toDTO ────────────────────────────────────────────────────────────────

    private static toDTO(cart: any): CartResponseDTO {
        const items = cart.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.unitPrice) * item.quantity,
            product: {
                name: item.product.name,
                slug: item.product.slug,
                image: item.product.images?.[0]?.url ?? null,
            },
            variant: item.variant ?? null,
        }));

        const subtotal = items.reduce((sum: number, i: any) => sum + i.totalPrice, 0);

        return {
            id: cart.id,
            items,
            itemCount: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
            subtotal,
        };
    }
}