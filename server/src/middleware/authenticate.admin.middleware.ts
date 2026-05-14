// src/middlewares/authenticateAdmin.ts
import type { Request, Response, NextFunction } from "express";
import { TokenService } from "@/modules/auth/token/token.service.js";
import { AppError } from "@/utils/appError.js";

export const isAdmin = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new AppError("Missing authorization header", 401);

  const token = header.slice(7);
  const payload = TokenService.verifyAccessToken(token, "Admin");

  if (payload.role !== "ADMIN") throw new AppError("Forbidden", 403);

  req.user = payload;
  next();
};