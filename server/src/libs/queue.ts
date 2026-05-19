import { Queue } from "bullmq";
import { redis } from "@/libs/cache.js";
import type { EmailJobMap, EmailJobName } from "@/libs/emails/email.queue.js";

export const emailQueue = new Queue<EmailJobMap[EmailJobName], void, EmailJobName>(
    "email",
    { connection: redis },
);