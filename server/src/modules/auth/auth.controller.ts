// src/modules/auth/auth.controller.ts
import type { NextFunction, Request, Response} from "express";
import { AuthService } from "./auth.service.js";
import { AppError } from "@/utils/appError.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { sendSuccess } from "@/utils/response.js";
import type {
  RegisterUserDTO,
  LoginUserDTO,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./auth.schema.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  };
}

// ─── Controller ───────────────────────────────────────────────────────────────

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as RegisterUserDTO;
    const result = await AuthService.register(dto, extractMeta(req));
    sendSuccess(res, result, 201, "Registration successful");
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as LoginUserDTO;
    const result = await AuthService.login(dto, extractMeta(req));
    sendSuccess(res, result, 200, "Login successful");
  });

  static verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await AuthService.verifyEmail(req.query.token as string);
        res.json({ message: "Email verified successfully" });
    } catch (err) {
        next(err);
    }
};

  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as RefreshTokenDto;
    const tokens = await AuthService.refresh(dto);
    sendSuccess(res, tokens, 200, "Tokens refreshed");
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.user!;
    const jti = req.jti;
    if (!jti) throw new AppError("Missing token identifier", 400);
    await AuthService.logout(jti, id);
    sendSuccess(res, null, 200, "Logged out successfully");
  });

  static logoutAll = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.user!;
    await AuthService.logoutAll(id);
    sendSuccess(res, null, 200, "All sessions revoked");
  });

  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as ForgotPasswordDto;
    await AuthService.forgotPassword(dto);
    sendSuccess(res, null, 200, "If that email exists, a reset link has been sent");
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as ResetPasswordDto;
    await AuthService.resetPassword(dto);
    sendSuccess(res, null, 200, "Password reset successfully");
  });
}