import { Router } from "express";
import { ReviewController } from "./reviews.controller.js";
import { validate } from "@/middleware/validate.middleware.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import { authorize } from "@/middleware/rbac.middleware.js";
import {
    createReviewSchema,
    updateReviewSchema,
    reviewParamsSchema,
    reviewSlugParamsSchema,
} from "./reviews.schema.js";

// ─── Nested under /products/:slug/reviews ─────────────────────────────────────

const router = Router({ mergeParams: true });

// GET /products/:slug/reviews  (public)
router.get(
    "/",
    validate(reviewSlugParamsSchema),
    ReviewController.getReviews,
);

// POST /products/:slug/reviews  (authenticated users)
router.post(
    "/",
    authenticate,
    validate(createReviewSchema),
    ReviewController.createReview,
);

export default router;

// ─── Standalone review routes (mount at /reviews) ────────────────────────────

export const reviewRouter = Router();

// PATCH /reviews/:id  (admin: toggle visibility)
reviewRouter.patch(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    validate(updateReviewSchema),
    ReviewController.updateReview,
);

// DELETE /reviews/:id  (admin)
reviewRouter.delete(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    validate(reviewParamsSchema),
    ReviewController.deleteReview,
);
