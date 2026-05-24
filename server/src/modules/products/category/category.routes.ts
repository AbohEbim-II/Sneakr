import { Router } from "express";
import { CategoryController } from "./category.controller.js";
import { validate } from "@/middleware/validate.middleware.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import { authorize } from "@/middleware/rbac.middleware.js";
import {
    createCategorySchema,
    updateCategorySchema,
    categoryParamsSchema,
} from "./category.schema.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

router.get("/", CategoryController.listCategories);
router.get("/:id", validate(categoryParamsSchema), CategoryController.getCategory);

// ─── Admin only ───────────────────────────────────────────────────────────────

router.post(
    "/",
    authenticate,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(createCategorySchema),
    CategoryController.createCategory,
);

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(updateCategorySchema),
    CategoryController.updateCategory,
);

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(categoryParamsSchema),
    CategoryController.deleteCategory,
);

export default router;