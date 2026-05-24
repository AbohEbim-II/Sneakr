import type { Request, Response, NextFunction } from "express";
import { ReviewService } from "./reviews.service.js";
import type { CreateReviewDTO, UpdateReviewDTO } from "./reviews.schema.js";

export class ReviewController {

    // GET /products/:slug/reviews
    static async getReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const reviews = await ReviewService.getReviews(req.params.slug as string);
            res.json({ data: reviews });
        } catch (err) {
            next(err);
        }
    }

    // POST /products/:slug/reviews
    static async createReview(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = req.body as CreateReviewDTO;
            const userId = req.user!.id; // set by authenticate middleware
            const review = await ReviewService.createReview(req.params.slug as string, userId, dto);
            res.status(201).json({ data: review });
        } catch (err) {
            next(err);
        }
    }

    // PATCH /reviews/:id  (admin: toggle visibility)
    static async updateReview(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = req.body as UpdateReviewDTO;
            const review = await ReviewService.updateReview(req.params.id as string, dto);
            res.json({ data: review });
        } catch (err) {
            next(err);
        }
    }

    // DELETE /reviews/:id  (admin)
    static async deleteReview(req: Request, res: Response, next: NextFunction) {
        try {
            await ReviewService.deleteReview(req.params.id as string);
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    }
}
