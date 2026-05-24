import prisma from "@/config/prisma.js";
import { AppError } from "@/utils/appError.js";
import slugify from "slugify";
import type { CreateCategoryDTO, UpdateCategoryDTO } from "./category.schema.js";

export interface CategoryDTO {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

export class CategoryService {

    // ─── List categories ──────────────────────────────────────────────────────

    static async listCategories(): Promise<CategoryDTO[]> {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
        });

        return categories.map(this.toDTO);
    }

    // ─── Get category ─────────────────────────────────────────────────────────

    static async getCategory(id: string): Promise<CategoryDTO> {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) throw new AppError("Category not found", 404);

        return this.toDTO(category);
    }

    // ─── Create category ──────────────────────────────────────────────────────

    static async createCategory(dto: CreateCategoryDTO): Promise<CategoryDTO> {
        const slug = slugify(dto.name, { lower: true, strict: true });

        const existing = await prisma.category.findUnique({ where: { slug } });
        if (existing) throw new AppError("Category with this name already exists", 409);

        const category = await prisma.category.create({
            data: { name: dto.name, slug },
        });

        return this.toDTO(category);
    }

    // ─── Update category ──────────────────────────────────────────────────────

    static async updateCategory(id: string, dto: UpdateCategoryDTO): Promise<CategoryDTO> {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) throw new AppError("Category not found", 404);

        const data: { name?: string; slug?: string } = {};

        if (dto.name) {
            const slug = slugify(dto.name, { lower: true, strict: true });

            const conflict = await prisma.category.findFirst({
                where: { slug, NOT: { id } },
            });
            if (conflict) throw new AppError("Category with this name already exists", 409);

            data.name = dto.name;
            data.slug = slug;
        }

        const updated = await prisma.category.update({
            where: { id },
            data,
        });

        return this.toDTO(updated);
    }

    // ─── Delete category ──────────────────────────────────────────────────────

    static async deleteCategory(id: string): Promise<void> {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) throw new AppError("Category not found", 404);

        const productCount = await prisma.product.count({
            where: { categoryId: id, deletedAt: null },
        });
        if (productCount > 0) {
            throw new AppError(
                `Cannot delete category with ${productCount} active product(s)`,
                409,
            );
        }

        await prisma.category.delete({ where: { id } });
    }

    // ─── DTO ──────────────────────────────────────────────────────────────────

    private static toDTO(category: any): CategoryDTO {
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }
}