import prisma from "@/config/prisma.js";
import { AppError } from "@/utils/appError.js";
import slugify from "slugify";
import type { CreateBrandDTO, UpdateBrandDTO } from "./brands.schema.js";

export interface BrandDTO {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class BrandService {

    // ─── List brands ──────────────────────────────────────────────────────────

    static async listBrands(): Promise<BrandDTO[]> {
        const brands = await prisma.brand.findMany({
            orderBy: { name: "asc" },
        });

        return brands.map(this.toDTO);
    }

    // ─── Get brand ────────────────────────────────────────────────────────────

    static async getBrand(id: string): Promise<BrandDTO> {
        const brand = await prisma.brand.findUnique({ where: { id } });
        if (!brand) throw new AppError("Brand not found", 404);

        return this.toDTO(brand);
    }

    // ─── Create brand ─────────────────────────────────────────────────────────

    static async createBrand(dto: CreateBrandDTO): Promise<BrandDTO> {
        const slug = slugify(dto.name, { lower: true, strict: true });

        const existing = await prisma.brand.findUnique({ where: { slug } });
        if (existing) throw new AppError("Brand with this name already exists", 409);

        const brand = await prisma.brand.create({
            data: { name: dto.name, slug, logoUrl: dto.logoUrl ?? null },
        });

        return this.toDTO(brand);
    }

    // ─── Update brand ─────────────────────────────────────────────────────────

    static async updateBrand(id: string, dto: UpdateBrandDTO): Promise<BrandDTO> {
        const brand = await prisma.brand.findUnique({ where: { id } });
        if (!brand) throw new AppError("Brand not found", 404);

        const data: { name?: string; slug?: string; logoUrl?: string | null } = {};

        if (dto.name) {
            const slug = slugify(dto.name, { lower: true, strict: true });

            const conflict = await prisma.brand.findFirst({
                where: { slug, NOT: { id } },
            });
            if (conflict) throw new AppError("Brand with this name already exists", 409);

            data.name = dto.name;
            data.slug = slug;
        }

        if (dto.logoUrl !== undefined) {
            data.logoUrl = dto.logoUrl;
        }

        const updated = await prisma.brand.update({ where: { id }, data });
        return this.toDTO(updated);
    }

    // ─── Delete brand ─────────────────────────────────────────────────────────

    static async deleteBrand(id: string): Promise<void> {
        const brand = await prisma.brand.findUnique({ where: { id } });
        if (!brand) throw new AppError("Brand not found", 404);

        const productCount = await prisma.product.count({
            where: { brandId: id, deletedAt: null },
        });
        if (productCount > 0) {
            throw new AppError(
                `Cannot delete brand with ${productCount} active product(s)`,
                409,
            );
        }

        await prisma.brand.delete({ where: { id } });
    }

    // ─── DTO ──────────────────────────────────────────────────────────────────

    private static toDTO(brand: any): BrandDTO {
        return {
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            logoUrl: brand.logoUrl,
            createdAt: brand.createdAt,
            updatedAt: brand.updatedAt,
        };
    }
}
