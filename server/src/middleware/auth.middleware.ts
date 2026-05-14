// src/middlewares/authenticate.ts
import type { Request, Response, NextFunction } from "express";
import { TokenService } from "@/modules/auth/token/token.service.js";
import { AppError } from "@/utils/appError.js";

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new AppError("Missing authorization header", 401);

  const token = header.slice(7);
  const payload = TokenService.verifyAccessToken(token, "User");

  req.user = payload;
  next();
};