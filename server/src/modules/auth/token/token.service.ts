// auth/token.service.ts
import jwt, { type SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { env } from "@/config/env.js";
import prisma from "@/config/prisma.js";
import { redis } from "@/config/redis.js";
import { logger } from "@/libs/logger.js";
import { AppError } from "@/utils/appError.js";
import { hashPassword, comparePassword } from "@/utils/password.js";
import ms, { type StringValue } from "ms";
import type { TokenPayload, UserType } from "./token.types.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const REFRESH_TTL_MS = ms(env.JWT_REFRESH_EXPIRATION as StringValue);
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;

// ─── Config ───────────────────────────────────────────────────────────────────

const SHARED_CONFIG = {
  secret: env.JWT_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  model: prisma.refreshToken,
};

const CONFIG: Record<UserType, { secret: string; refreshSecret: string; model: any }> = {
  User: SHARED_CONFIG,
  Admin: SHARED_CONFIG,
};
// ─── Helpers ──────────────────────────────────────────────────────────────────

function getConfig(type: UserType) {
  return CONFIG[type];
}

function blacklistKey(jti: string) {
  return `bl_${jti}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class TokenService {
  static generateAccessToken(payload: TokenPayload): string {
    const { secret } = getConfig(payload.type);
    return jwt.sign(payload, secret, {
      expiresIn: env.JWT_ACCESS_EXPIRATION,
    } as SignOptions);
  }

  static generateRefreshToken(payload: TokenPayload): { refreshToken: string; jti: string } {
    const jti = randomUUID();
    const { refreshSecret } = getConfig(payload.type);

    const refreshToken = jwt.sign({ ...payload, jti }, refreshSecret, {
      expiresIn: env.JWT_REFRESH_EXPIRATION,
    } as SignOptions);

    return { refreshToken, jti };
  }

  static generateTokenPair(payload: TokenPayload) {
    return {
      accessToken: this.generateAccessToken(payload),
      ...this.generateRefreshToken(payload),
    };
  }

  static async saveRefreshToken(params: {
    token: string;
    userId: string;
    jti: string;
    type: UserType;
    meta?: { ipAddress?: string; userAgent?: string };
  }): Promise<{ expiresAt: Date }> {
    const { token, userId, jti, type, meta } = params;
    const { model } = getConfig(type);
    const tokenHash = await hashPassword(token);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    await (model as any).create({
      data: {
        jti,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        ...meta,
        user: { connect: { id: userId } },
      },
    });

    logger.info({ userId, jti, type, event: "TOKEN_ISSUED" }, "Refresh token stored");
    return { expiresAt };
  }

  static verifyAccessToken(token: string, type: UserType): TokenPayload {
    const { secret } = getConfig(type);

    try {
      const decoded = jwt.verify(token, secret) as TokenPayload;

      if (!decoded.sub || !decoded.role) {
        throw new AppError("Invalid token payload", 401);
      }

      return decoded;
    } catch {
      logger.warn({ type, event: "INVALID_ACCESS_TOKEN" }, "Access token verification failed");
      throw new AppError("Invalid or expired token", 401);
    }
  }

  static async verifyRefreshToken(token: string, type: UserType): Promise<TokenPayload> {
    const { refreshSecret, model } = getConfig(type);

    try {
      const payload = jwt.verify(token, refreshSecret) as TokenPayload;

      const [isRevoked, stored] = await Promise.all([
        redis.get(blacklistKey(payload.jti!)),
        (model as any).findUnique({ where: { jti: payload.jti } }),
      ]);

      if (isRevoked) throw new AppError("Token revoked", 401);
      if (!stored || !(await comparePassword(token, stored.tokenHash))) {
        throw new AppError("Invalid refresh token", 401);
      }

      return payload;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Invalid or expired refresh token", 401);
    }
  }

  static decodeWithoutVerification(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }

  static async revokeToken(jti: string, type: UserType): Promise<void> {
    const { model } = getConfig(type);

    await Promise.all([
      redis.set(blacklistKey(jti), "1", "EX", REFRESH_TTL_SEC),
      (model as any).delete({ where: { jti } }).catch(() => {}),
    ]);
  }

  static async revokeAllUserTokens(userId: string, type: UserType): Promise<void> {
    const { model } = getConfig(type);

    const tokens: { jti: string }[] = await (model as any).findMany({
      where: { userId },
      select: { jti: true },
    });

    if (tokens.length === 0) return;

    const pipeline = redis.multi();
    tokens.forEach(({ jti }) => pipeline.set(blacklistKey(jti), "1", "EX", REFRESH_TTL_SEC));
    await pipeline.exec();

    await (model as any).deleteMany({ where: { userId } });

    logger.info(
      { userId, type, count: tokens.length, event: "ALL_REFRESH_TOKENS_REVOKED" },
      "All active sessions revoked",
    );
  }
}