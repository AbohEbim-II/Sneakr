// src/modules/auth/auth.routes.ts
import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validate } from "@/middleware/validate.middleware.js";
import { authenticate } from "@/middleware/auth.middleware.js";
import {isAdmin} from "@/middleware/authenticate.admin.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

router.post("/register", validate(registerSchema), AuthController.register);
router.post("/login", validate(loginSchema), AuthController.login);
router.get("/verify-email", AuthController.verifyEmail);
router.post("/refresh", validate(refreshTokenSchema), AuthController.refresh);
router.post("/forgot-password", validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), AuthController.resetPassword);

// ─── Protected ────────────────────────────────────────────────────────────────

router.post("/logout", authenticate, AuthController.logout);
router.post("/logout-all", authenticate, isAdmin, AuthController.logoutAll);

export default router;