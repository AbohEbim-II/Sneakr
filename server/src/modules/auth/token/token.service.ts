import jwt, { type SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { env } from "@/config/env.js";
import prisma from "@/config/prisma.js";
import { redis } from "@/config/redis.js";
import { logger } from "@/libs/logger.js";
import { AppError } from "@/utils/appError.js";
import { hashPassword, comparePassword } from "@/utils/password.js";
import ms, { type StringValue } from "ms";
import type { TokenPayload } from "./token.types.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const REFRESH_TTL_MS = ms(env.JWT_REFRESH_EXPIRATION as StringValue);
const REFRESH_TTL_SEC = Math.floor(REFRESH_TTL_MS / 1000);

function blacklistKey(jti: string) {
    return `bl_${jti}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class TokenService {
    static generateAccessToken(payload: TokenPayload): string {
        return jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_ACCESS_EXPIRATION,
        } as SignOptions);
    }

    static generateRefreshToken(payload: TokenPayload): { refreshToken: string; jti: string } {
        const jti = randomUUID();
        const refreshToken = jwt.sign({ ...payload, jti }, env.JWT_REFRESH_SECRET, {
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
        meta?: { ipAddress?: string; userAgent?: string };
    }): Promise<{ expiresAt: Date }> {
        const { token, userId, jti, meta } = params;
        const tokenHash = await hashPassword(token);
        const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

        await prisma.refreshToken.create({
            data: {
                jti,
                tokenHash,
                expiresAt,
                ...meta,
                user: { connect: { id: userId } },
            },
        });

        logger.info({ userId, jti, event: "TOKEN_ISSUED" }, "Refresh token stored");
        return { expiresAt };
    }

    static verifyAccessToken(token: string): TokenPayload {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

            if (!decoded.sub || !decoded.role) {
                throw new AppError("Invalid token payload", 401);
            }

            return decoded;
        } catch {
            logger.warn({ event: "INVALID_ACCESS_TOKEN" }, "Access token verification failed");
            throw new AppError("Invalid or expired token", 401);
        }
    }

    static async verifyRefreshToken(token: string): Promise<TokenPayload> {
        try {
            const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;

            const [isRevoked, stored] = await Promise.all([
                redis.get(blacklistKey(payload.jti!)),
                prisma.refreshToken.findUnique({ where: { jti: payload.jti } }),
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

    static async revokeToken(jti: string): Promise<void> {
        await Promise.all([
            redis.set(blacklistKey(jti), "1", "EX", REFRESH_TTL_SEC),
            prisma.refreshToken.delete({ where: { jti } }).catch(() => {}),
        ]);
    }

    static async revokeAllUserTokens(userId: string): Promise<void> {
        const tokens = await prisma.refreshToken.findMany({
            where: { userId },
            select: { jti: true },
        });

        if (tokens.length === 0) return;

        const pipeline = redis.multi();
        tokens.forEach(({ jti }) =>
            pipeline.set(blacklistKey(jti), "1", "EX", REFRESH_TTL_SEC),
        );
        await pipeline.exec();

        await prisma.refreshToken.deleteMany({ where: { userId } });

        logger.info(
            { userId, count: tokens.length, event: "ALL_REFRESH_TOKENS_REVOKED" },
            "All active sessions revoked",
        );
    }
}