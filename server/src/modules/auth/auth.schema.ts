// src/modules/auth/auth.schema.ts
import { z } from 'zod'

// ✅ Zod v4
const emailSchema = z
 .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .transform((val) => val.trim().toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(64, 'Password must not exceed 64 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    'Password must contain uppercase, lowercase, number and special character'
  )

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: emailSchema,
    phoneNumber: z.string().optional(),
    password: passwordSchema,

  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),
})

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
})

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
})

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  }).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  ),
})

export type RegisterUserDTO = z.infer<typeof registerSchema>["body"];

export type LoginUserDTO = z.infer<typeof loginSchema>["body"];

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>["body"];

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>["body"];

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>["body"];