import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    // Server
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z.coerce.number().default(5000),
    FRONTEND_URL: z.string().default("http://localhost:3000"),

    // Database
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    // JWT
    JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z
        .string()
        .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_ACCESS_EXPIRATION: z.string().default("15m"),
    JWT_REFRESH_EXPIRATION: z.string().default("7d"),

    // Redis
    REDIS_URL: z.string().min(1, "REDIS_URL is required"),
    REDIS_PORT: z.coerce.number().min(1, "REDIS_PORT is required").default(6379),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
    CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
    CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

    // SMTP (email)
    SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
    SMTP_PORT: z.coerce.number().min(1, "SMTP_PORT is required"),
    SMTP_SECURE: z.enum(["true", "false"]).transform(val => val === 'true').default(false),
    SMTP_USER: z.string().min(1, "SMTP_USER is required"),
    SMTP_PASS: z.string().min(1, "RESEND_API_KEY is required"),
    RESEND_FROM: z.string().default("Sneakr <onboarding@resend.dev>"), // swap domain in prod
    CLIENT_URL: z.string().default("http://localhost:5000"),

});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error(
        "❌ Invalid environment variables:",
        parsedEnv.error.format(),
    );
    process.exit(1);
}

export const env = parsedEnv.data;
