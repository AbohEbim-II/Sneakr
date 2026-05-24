import type { Request, Response, NextFunction } from "express";
import { BrandService } from "./brands.service.js";
import type { CreateBrandDTO, UpdateBrandDTO } from "./brands.schema.js";

export class BrandController {

    // GET /brands
    static async listBrands(req: Request, res: Response, next: NextFunction) {
        try {
            const brands = await BrandService.listBrands();
            res.json({ data: brands });
        } catch (err) {
            next(err);
        }
    }

    // GET /brands/:id
    static async getBrand(req: Request, res: Response, next: NextFunction) {
        try {
            const brand = await BrandService.getBrand(req.params.id as string);
            res.json({ data: brand });
        } catch (err) {
            next(err);
        }
    }

    // POST /brands
    static async createBrand(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = req.body as CreateBrandDTO;
            const brand = await BrandService.createBrand(dto);
            res.status(201).json({ data: brand });
        } catch (err) {
            next(err);
        }
    }

    // PATCH /brands/:id
    static async updateBrand(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = req.body as UpdateBrandDTO;
            const brand = await BrandService.updateBrand(req.params.id as string, dto);
            res.json({ data: brand });
        } catch (err) {
            next(err);
        }
    }

    // DELETE /brands/:id
    static async deleteBrand(req: Request, res: Response, next: NextFunction) {
        try {
            await BrandService.deleteBrand(req.params.id as string);
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    }
}
