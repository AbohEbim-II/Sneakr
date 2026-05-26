import { Worker, type Job } from "bullmq";
import { env } from "@/config/env.js";
import { logger } from "@/libs/logger.js";
import { sendMail } from "@/libs/mail.js";
import  WelcomeEmail  from "./templates/welcome.email.js";
import  PasswordResetEmail  from "./templates/password-reset.email.js";
import type { EmailJobMap, EmailJobName } from "./email.queue.js";
import { render } from "@react-email/render";

// ─── Job processor ────────────────────────────────────────────────────────────

async function processEmailJob(
    job: Job<EmailJobMap[EmailJobName], void, EmailJobName>,
): Promise<void> {
    logger.info({ jobId: job.id, jobName: job.name }, "Processing email job");

    switch (job.name) {
        case "send:welcome": {
            const { to, ...data } = job.data as EmailJobMap["send:welcome"];
            const html  = await render( WelcomeEmail(data));
            await sendMail(to, "Welcome to Sneakr 👟", html);
            break;
        }

        case "send:password-reset": {
            const { to, ...data } = job.data as EmailJobMap["send:password-reset"];
            const html = await render(PasswordResetEmail(data));
            await sendMail(to, "Password Reset Request", html);
            break;
        }

        // case "send:password-changed": {
        //     const { to, ...data } = job.data as EmailJobMap["send:password-changed"];
        //     const { subject, html } = passwordChangedEmail(data);
        //     await sendMail(to, subject, html);
        //     break;
        // }


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