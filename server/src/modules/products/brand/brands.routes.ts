import { Router } from "express";
import { BrandController } from "./brands.controller.js";
import { validate } from "@/middleware/validate.middleware.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import { authorize } from "@/middleware/rbac.middleware.js";
import {
    createBrandSchema,
    updateBrandSchema,
    brandParamsSchema,
} from "./brands.schema.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

router.get("/", BrandController.listBrands);
router.get("/:id", validate(brandParamsSchema), BrandController.getBrand);

// ─── Admin only ───────────────────────────────────────────────────────────────

router.post(
    "/",
    authenticate,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(createBrandSchema),
    BrandController.createBrand,
);

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(updateBrandSchema),
    BrandController.updateBrand,
);

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(brandParamsSchema),
    BrandController.deleteBrand,
);

export default router;
