
// src/modules/auth/auth.service.ts
import { Role, type User } from "@/generated/prisma/index.js";
import prisma from "@/config/prisma.js";
import { redis } from "@/config/redis.js";
import { AppError } from "@/utils/appError.js";
import { hashPassword, comparePassword } from "@/utils/password.js";
import { TokenService } from "./token/token.service.js";
import { enqueueEmail } from "@/libs/emails/email.queue.js";
import { logger } from "@/libs/logger.js";
import { randomBytes } from "crypto";
import type {
  RegisterUserDTO,
  LoginUserDTO,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./auth.schema.js";
import type { UserResponseDTO } from "./auth.types.js";
import { env } from "@/config/env.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const RESET_TOKEN_TTL_SEC = 60 * 15; // 15 minutes
const RESET_KEY = (token: string) => `pwd_reset:${token}`;

// ─── Service ──────────────────────────────────────────────────────────────────

export class AuthService {
  static async register(
    dto: RegisterUserDTO,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ user: UserResponseDTO; accessToken: string; refreshToken: string }> {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new AppError("Email already in use", 409);

    const verificationToken = randomBytes(32).toString("hex");

    const user = await prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phoneNumber: dto.phoneNumber ?? null,
        password: await hashPassword(dto.password),
        verificationToken,                               // ✅ store on user
        verificationTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24hrs

      },
    });

    const payload = { sub: user.id, role: user.role, type: user.role };
    const { accessToken, refreshToken, jti } = TokenService.generateTokenPair(payload);

    await TokenService.saveRefreshToken({ token: refreshToken, userId: user.id, jti, meta });
    enqueueEmail("send:welcome", {
      to: user.email,
      recipientName: user.name ?? user.email,
      email: user.email,
      loginUrl: `${env.CLIENT_URL}/login`,
      verificationUrl: `${env.CLIENT_URL}/verify-email?token=${verificationToken}`
    });
    logger.info({
      userId: user.id,
      email: user.email,
      ipAddress: meta?.ipAddress,
      event: "USER_REGISTERED",
    },
      "New user registered",
    );

    return { user: this.toDTO(user), accessToken, refreshToken };
  }

  static async login(
    dto: LoginUserDTO,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ user: UserResponseDTO; accessToken: string; refreshToken: string }> {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await comparePassword(dto.password, user.password))) {
      throw new AppError("Invalid email or password", 401);
    }

    const payload = { sub: user.id, role: user.role, type: user.role };
    const { accessToken, refreshToken, jti } = TokenService.generateTokenPair(payload);

    await TokenService.saveRefreshToken({ token: refreshToken, userId: user.id, jti, meta });

    logger.info({
      userId: user.id,
      email: user.email,
      ipAddress: meta?.ipAddress,
      event: "USER_LOGIN",
    }, "User logged in");

    return { user: this.toDTO(user), accessToken, refreshToken };
  }
static async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
        where: {
            verificationToken: token,
            verificationTokenExpiresAt: { gt: new Date() }, // not expired
        },
    });

    if (!user) throw new AppError("Invalid or expired verification token", 400);
    if (user.isVerified) throw new AppError("Email already verified", 400);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verificationToken: null,           // ✅ clear token
            verificationTokenExpiresAt: null,  // ✅ clear expiry
        },
    });

    logger.info({ userId: user.id, event: "EMAIL_VERIFIED" }, "Email verified");
}

  static async refresh(
    dto: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = await TokenService.verifyRefreshToken(dto.refreshToken);

    await TokenService.revokeToken(payload.jti!);

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new AppError("User not found", 404);

    const newPayload = { sub: user.id, role: user.role, type: user.role };
    const { accessToken, refreshToken, jti } = TokenService.generateTokenPair(newPayload);

    await TokenService.saveRefreshToken({ token: refreshToken, userId: user.id, jti });

    logger.info({ userId: user.id, event: "TOKEN_REFRESHED" }, "Tokens rotated");

    return { accessToken, refreshToken };
  }

  static async logout(jti: string, userId: string): Promise<void> {
    await TokenService.revokeToken(jti);
    logger.info({ userId, event: "USER_LOGOUT" }, "User logged out");
  }

  static async logoutAll(userId: string): Promise<void> {
    await TokenService.revokeAllUserTokens(userId);
    logger.info({ userId, event: "USER_LOGOUT_ALL" }, "All sessions revoked");
  }

  static async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    // Always resolve to prevent email enumeration
    if (!user) return;

    const resetToken = randomBytes(32).toString("hex");
    await redis.set(RESET_KEY(resetToken), user.id, "EX", RESET_TOKEN_TTL_SEC);

    // TODO: dispatch email via mail service
    enqueueEmail("send:password-reset", {
      to: user.email,
      recipientName: user.name ?? user.email,
      resetUrl: `${env.CLIENT_URL}/reset-password?token=${resetToken}`,
      expiresInMinutes: RESET_TOKEN_TTL_SEC / 60,
    })
    logger.info({ userId: user.id, event: "PASSWORD_RESET_REQUESTED" }, "Reset token issued");
  }

  static async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const userId = await redis.get(RESET_KEY(dto.token));
    if (!userId) throw new AppError("Reset token is invalid or has expired", 400);

    await Promise.all([
      prisma.user.update({
        where: { id: userId },
        data: { password: await hashPassword(dto.newPassword) }
      }),
      redis.del(RESET_KEY(dto.token)),
      TokenService.revokeAllUserTokens(userId),
    ]);

    logger.info({ userId, event: "PASSWORD_RESET_SUCCESS" }, "Password reset successfully");
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private static toDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role
    };
  }
}