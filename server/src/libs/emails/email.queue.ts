import { Queue } from "bullmq";
import { env } from "@/config/env.js";
import { logger } from "@/libs/logger.js";
import type {WelcomeEmailProps} from "@/libs/emails/templates/welcome.email.js";
import type { PasswordResetEmailProps } from "./templates/password-reset.email.js";
// ─── Job type registry ────────────────────────────────────────────────────────

export type EmailJobMap = {
    "send:welcome": WelcomeEmailProps & { to: string };
    "send:password-reset": PasswordResetEmailProps & { to: string };
};

export type EmailJobName = keyof EmailJobMap;

// ─── Queue ────────────────────────────────────────────────────────────────────

export const emailQueue = new Queue<EmailJobMap[EmailJobName], void, EmailJobName>(
    "email",
    {
        connection: { url: env.REDIS_URL },
        defaultJobOptions: {
            attempts: 4,
            backoff: {
                type: "exponential",
                delay: 5_000, // 5s → 10s → 20s → 40s
            },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 500 },
        },
    },
);

// ─── Enqueue helper ───────────────────────────────────────────────────────────

/**
 * Enqueue an email job. Always fire-and-forget — never await in a controller.
 *
 * @example
 * enqueueEmail("send:welcome", { to: user.email, ... });
 */
export function enqueueEmail<K extends EmailJobName>(
    name: K,
    data: EmailJobMap[K],
): void {
    emailQueue.add(name, data).catch((err) => {
        logger.error(
            { err, jobName: name, event: "EMAIL_ENQUEUE_FAILED" },
            "Failed to enqueue email job — email will not be sent",
        );
    });
}