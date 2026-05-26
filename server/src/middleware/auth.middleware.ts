// src/middlewares/authenticate.ts
import type { Request, Response, NextFunction } from "express";
import { TokenService } from "@/modules/auth/token/token.service.js";
import { AppError } from "@/utils/appError.js";
import prisma from "@/config/prisma.js";

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return next(new AppError("Missing authorization header", 401));

    const token = header.slice(7);
    const payload = TokenService.verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { role: true, id: true }
    });
    if (!user) return next(new AppError("User no longer exists", 401));
    
    req.user = { ...payload, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};