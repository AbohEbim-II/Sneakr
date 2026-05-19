import { Worker, type Job } from "bullmq";
import { env } from "@/config/env.js";
import { logger } from "@/libs/logger.js";
import { sendMail } from "@/libs/mail.js";
import {
    welcomeEmail,
    passwordResetEmail,
    passwordChangedEmail,
    lowStockEmail,
    saleApprovedEmail,
} from "./email.templates.js";
import type { EmailJobMap, EmailJobName } from "./email.queue.js";

// ─── Job processor ────────────────────────────────────────────────────────────

async function processEmailJob(
    job: Job<EmailJobMap[EmailJobName], void, EmailJobName>,
): Promise<void> {
    logger.info({ jobId: job.id, jobName: job.name }, "Processing email job");

    switch (job.name) {
        case "send:welcome": {
            const { to, ...data } = job.data as EmailJobMap["send:welcome"];
            const { subject, html } = welcomeEmail(data);
            await sendMail(to, subject, html);
            break;
        }

        case "send:password-reset": {
            const { to, ...data } = job.data as EmailJobMap["send:password-reset"];
            const { subject, html } = passwordResetEmail(data);
            await sendMail(to, subject, html);
            break;
        }

        case "send:password-changed": {
            const { to, ...data } = job.data as EmailJobMap["send:password-changed"];
            const { subject, html } = passwordChangedEmail(data);
            await sendMail(to, subject, html);
            break;
        }

        case "send:low-stock": {
            const { to, ...data } = job.data as EmailJobMap["send:low-stock"];
            const { subject, html } = lowStockEmail(data);
            await sendMail(to, subject, html);
            break;
        }

        case "send:sale-approved": {
            const { to, ...data } = job.data as EmailJobMap["send:sale-approved"];
            const { subject, html } = saleApprovedEmail(data);
            await sendMail(to, subject, html);
            break;
        }

        default: {
            // Exhaustiveness guard — TypeScript will catch unhandled cases at compile time
            const _exhaustive: never = job.name;
            logger.warn({ jobName: _exhaustive }, "Unknown email job type — skipping");
        }
    }

    logger.info({ jobId: job.id, jobName: job.name }, "Email job completed");
}

// ─── Worker bootstrap ─────────────────────────────────────────────────────────

export type EmailWorker = Worker<EmailJobMap[EmailJobName], void, EmailJobName>;

export function startEmailWorker(): EmailWorker {
    const worker: EmailWorker = new Worker("email", processEmailJob, {
        connection: { url: env.REDIS_URL },
        concurrency: 5,
        limiter: {
            max: 50,       // max 50 jobs
            duration: 60_000, // per minute — stay within SMTP provider rate limits
        },
    });

    worker.on("completed", (job) => {
        logger.info({ jobId: job.id, jobName: job.name }, "Email sent");
    });

    worker.on("failed", (job, err) => {
        logger.error(
            {
                jobId: job?.id,
                jobName: job?.name,
                attempts: job?.attemptsMade,
                err,
                event: "EMAIL_JOB_FAILED",
            },
            "Email job failed",
        );
    });

    worker.on("error", (err) => {
        logger.error({ err, event: "EMAIL_WORKER_ERROR" }, "Email worker error");
    });

    logger.info("Email worker started");
    return worker;
}