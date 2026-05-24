import type { Request, Response, NextFunction } from "express";
import { CategoryService } from "./category.service.js";
import type { CreateCategoryDTO, UpdateCategoryDTO } from "./category.schema.js";

export class CategoryController {

    // GET /categories
    static async listCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await CategoryService.listCategories();
            res.json({ data: categories });
        } catch (err) {
            next(err);
        }
    }

    // GET /categories/:id
    static async getCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const category = await CategoryService.getCategory(req.params.id as string);
            res.json({ data: category });
        } catch (err) {
            next(err);
        }
    }

    // POST /categories
    static async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = req.body as CreateCategoryDTO;
            const category = await CategoryService.createCategory(dto);
            res.status(201).json({ data: category });
        } catch (err) {
            next(err);
        }
    }

    // PATCH /categories/:id
    static async updateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = req.body as UpdateCategoryDTO;
            const category = await CategoryService.updateCategory(req.params.id as string, dto);
            res.json({ data: category });
        } catch (err) {
            next(err);
        }
    }

    // DELETE /categories/:id
    static async deleteCategory(req: Request, res: Response, next: NextFunction) {
        try {
            await CategoryService.deleteCategory(req.params.id as string);
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    }
}