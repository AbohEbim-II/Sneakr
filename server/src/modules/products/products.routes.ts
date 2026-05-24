import { Router } from "express";
import { ProductController } from "./products.controller.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import {authorize} from "@/middleware/rbac.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { upload } from "@/middleware/upload.middleware.js";
import {
    listProductsSchema,
    getProductSchema,
    createProductSchema,
    updateProductSchema,
    createVariantSchema,
    createReviewSchema,
} from "./products.schema.js";

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.get("/", validate(listProductsSchema), ProductController.listProducts);
router.get("/:slug", validate(getProductSchema), ProductController.getProduct);
router.get("/:slug/reviews", ProductController.getReviews);

// ── Authenticated routes ──────────────────────────────────────────────────────
router.post("/:slug/reviews", authenticate, validate(createReviewSchema), ProductController.createReview);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.post("/", authenticate, authorize("ADMIN", "SUPER_ADMIN"), validate(createProductSchema), ProductController.createProduct);
router.patch("/:id", authenticate, authorize("ADMIN", "SUPER_ADMIN"), validate(updateProductSchema), ProductController.updateProduct);
router.delete("/:id", authenticate, authorize("ADMIN", "SUPER_ADMIN"), ProductController.deleteProduct);
router.post("/:id/images", authenticate, authorize("ADMIN", "SUPER_ADMIN"), upload.single("image"), ProductController.uploadImage);
router.delete("/:id/images/:imageId", authenticate, authorize("ADMIN", "SUPER_ADMIN"), ProductController.deleteImage);
router.post("/:id/variants", authenticate, authorize("ADMIN", "SUPER_ADMIN"), validate(createVariantSchema), ProductController.createVariant);

export default router;