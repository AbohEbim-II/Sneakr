import { Router } from "express";
import { CartController } from "./cart.controller.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import {
    addCartItemSchema,
    updateCartItemSchema,
    removeCartItemSchema,
} from "./cart.schema.js";

const router = Router();

router.use(authenticate); // all cart routes require auth

router.get("/", CartController.getCart);
router.post("/items", validate(addCartItemSchema), CartController.addItem);
router.patch("/items/:itemId", validate(updateCartItemSchema), CartController.updateItem);
router.delete("/items/:itemId", validate(removeCartItemSchema), CartController.removeItem);
router.delete("/", CartController.clearCart);

export default router;