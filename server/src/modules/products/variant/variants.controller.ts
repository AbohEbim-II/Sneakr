import type { Request, Response, NextFunction } from "express";
import { VariantService } from "./variants.service.js";
import type { CreateVariantDTO, UpdateVariantDTO } from "./variants.schema.js";

export class VariantController {

    // GET /products/:productId/variants
    static async listVariants(req: Request, res: Response, next: NextFunction) {
        try {
            const variants = await VariantService.listVariants(req.params.productId as string);
            res.json({ data: variants });
        } catch (err) {
            next(err);
        }
    }

    // GET /variants/:id
    static async getVariant(req: Request, res: Response, next: NextFunction) {
        try {
            const variant = await VariantService.getVariant(req.params.id as string);
            res.json({ data: variant });
        } catch (err) {
            next(err);
        }
    }

    // POST /products/:productId/variants
    static async createVariant(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = req.body as CreateVariantDTO;
            const variant = await VariantService.createVariant(req.params.productId as string, dto);
            res.status(201).json({ data: variant });
        } catch (err) {
            next(err);
        }
    }

    // PATCH /variants/:id
    static async updateVariant(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = req.body as UpdateVariantDTO;
            const variant = await VariantService.updateVariant(req.params.id as string, dto);
            res.json({ data: variant });
        } catch (err) {
            next(err);
        }
    }

    // DELETE /variants/:id
    static async deleteVariant(req: Request, res: Response, next: NextFunction) {
        try {
            await VariantService.deleteVariant(req.params.id as string);
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    }
}
