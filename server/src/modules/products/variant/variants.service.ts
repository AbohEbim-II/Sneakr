import prisma from "@/config/prisma.js";
import { AppError } from "@/utils/appError.js";
import type { CreateVariantDTO, UpdateVariantDTO } from "./variants.schema.js";

export interface VariantDTO {
    id: string;
    productId: string;
    size: string;
    colorName: string | null;
    colorHex: string | null;
    stock: number;
    sku: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class VariantService {

    // ─── List variants for a product ──────────────────────────────────────────

    static async listVariants(productId: string): Promise<VariantDTO[]> {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new AppError("Product not found", 404);

        const variants = await prisma.variant.findMany({
            where: { productId },
            orderBy: { size: "asc" },
        });

        return variants.map(this.toDTO);
    }

    // ─── Get variant ──────────────────────────────────────────────────────────

    static async getVariant(id: string): Promise<VariantDTO> {
        const variant = await prisma.variant.findUnique({ where: { id } });
        if (!variant) throw new AppError("Variant not found", 404);

        return this.toDTO(variant);
    }

    // ─── Create variant ───────────────────────────────────────────────────────

    static async createVariant(productId: string, dto: CreateVariantDTO): Promise<VariantDTO> {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new AppError("Product not found", 404);

        const existing = await prisma.variant.findFirst({
            where: { productId, size: dto.size, colorName: dto.colorName ?? null },
        });
        if (existing) throw new AppError("Variant with this size and color already exists", 409);

        if (dto.sku) {
            const skuConflict = await prisma.variant.findUnique({ where: { sku: dto.sku } });
            if (skuConflict) throw new AppError("SKU already in use", 409);
        }

        const variant = await prisma.variant.create({
            data: {
                productId,
                size: dto.size,
                colorName: dto.colorName ?? null,
                colorHex: dto.colorHex ?? null,
                stock: dto.stock,
                sku: dto.sku ?? null,
            },
        });

        return this.toDTO(variant);
    }

    // ─── Update variant ───────────────────────────────────────────────────────

    static async updateVariant(id: string, dto: UpdateVariantDTO): Promise<VariantDTO> {
        const variant = await prisma.variant.findUnique({ where: { id } });
        if (!variant) throw new AppError("Variant not found", 404);

        // Check uniqueness if size or color changed
        if (dto.size || dto.colorName !== undefined) {
            const newSize = dto.size ?? variant.size;
            const newColor = dto.colorName !== undefined ? dto.colorName : variant.colorName;

            const conflict = await prisma.variant.findFirst({
                where: {
                    productId: variant.productId,
                    size: newSize,
                    colorName: newColor,
                    NOT: { id },
                },
            });
            if (conflict) throw new AppError("Variant with this size and color already exists", 409);
        }

        if (dto.sku) {
            const skuConflict = await prisma.variant.findFirst({
                where: { sku: dto.sku, NOT: { id } },
            });
            if (skuConflict) throw new AppError("SKU already in use", 409);
        }

        const updated = await prisma.variant.update({ where: { id }, data: dto });
        return this.toDTO(updated);
    }

    // ─── Delete variant ───────────────────────────────────────────────────────

    static async deleteVariant(id: string): Promise<void> {
        const variant = await prisma.variant.findUnique({ where: { id } });
        if (!variant) throw new AppError("Variant not found", 404);

        await prisma.variant.delete({ where: { id } });
    }

    // ─── DTO ──────────────────────────────────────────────────────────────────

    private static toDTO(variant: any): VariantDTO {
        return {
            id: variant.id,
            productId: variant.productId,
            size: variant.size,
            colorName: variant.colorName,
            colorHex: variant.colorHex,
            stock: variant.stock,
            sku: variant.sku,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt,
        };
    }
}
