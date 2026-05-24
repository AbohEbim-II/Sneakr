import type { Request, Response, NextFunction } from "express";
import { ProductService } from "./products.service.js";

export class ProductController {
    static listProducts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await ProductService.listProducts(req.query as any);
            res.json({ status: "success", data: result });
        } catch (err) { next(err); }
    };

    static getProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const product = await ProductService.getProduct(req.params.slug as string);
            res.json({ status: "success", data: product });
        } catch (err) { next(err); }
    };

    static createProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const product = await ProductService.createProduct(req.body);
            res.status(201).json({ status: "success", data: product });
        } catch (err) { next(err); }
    };

    static updateProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const product = await ProductService.updateProduct(req.params.id as string, req.body);
            res.json({ status: "success", data: product });
        } catch (err) { next(err); }
    };

    static deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ProductService.deleteProduct(req.params.id as string);
            res.json({ status: "success", message: "Product deleted" });
        } catch (err) { next(err); }
    };

    static uploadImage = async (req: Request, res: Response, next: NextFunction) => {
        try {
            console.log("PARAMS:", req.params);
            console.log("FILE:", req.file);
            console.log("BODY:", req.body);
            await ProductService.uploadImage(
                req.params.id as string,
                req.file!,
                req.body.altText,
            );
            
            res.status(201).json({ status: "success", message: "Image uploaded" });
        } catch (err) { next(err); }
    };

    static deleteImage = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ProductService.deleteProductImage(req.params.imageId as string);
            res.json({ status: "success", message: "Image deleted" });
        } catch (err) { next(err); }
    };

    static createVariant = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const variant = await ProductService.createVariant(req.params.id as string, req.body);
            res.status(201).json({ status: "success", data: variant });
        } catch (err) { next(err); }
    };

    static getReviews = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const reviews = await ProductService.getReviews(req.params.slug as string);
            res.json({ status: "success", data: reviews });
        } catch (err) { next(err); }
    };

    static createReview = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const review = await ProductService.createReview(
                req.params.slug as string,
                req.user!.id,
                req.body,
            );
            res.status(201).json({ status: "success", data: review });
        } catch (err) { next(err); }
    };
}