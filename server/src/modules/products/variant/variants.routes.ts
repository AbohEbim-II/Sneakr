import { Router } from "express";
import { VariantController } from "./variants.controller.js";
import { validate } from "@/middleware/validate.middleware.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import { authorize } from "@/middleware/rbac.middleware.js";
import {
    createVariantSchema,
    updateVariantSchema,
    variantParamsSchema,
} from "./variants.schema.js";

const router = Router({ mergeParams: true });

// ─── Public ───────────────────────────────────────────────────────────────────

// GET /products/:productId/variants
router.get("/", VariantController.listVariants);

// ─── Admin only ───────────────────────────────────────────────────────────────

// POST /products/:productId/variants
router.post(
    "/",
    authenticate,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(createVariantSchema),
    VariantController.createVariant,
);

export default router;

// ─── Standalone variant routes (mount at /variants) ───────────────────────────
// PATCH /variants/:id
// DELETE /variants/:id
// GET /variants/:id

export const variantRouter = Router();

variantRouter.get(
    "/:id",
    validate(variantParamsSchema),
    VariantController.getVariant,
);

variantRouter.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(updateVariantSchema),
    VariantController.updateVariant,
);

variantRouter.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(variantParamsSchema),
    VariantController.deleteVariant,
);
