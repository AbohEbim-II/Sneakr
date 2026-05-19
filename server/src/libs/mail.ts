import nodemailer, { type Transporter, type SentMessageInfo } from "nodemailer";
import { env } from "@/config/env.js";
import { logger } from "@/libs/logger.js";

// ─── Transporter ──────────────────────────────────────────────────────────────

let _transporter: Transporter | null = null;

export function getTransporter(): Transporter {
    if (_transporter) return _transporter;

    _transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        socketTimeout: 60_000,
        connectionTimeout: 60_000,
        greetingTimeout: 30_000,
    });

    _transporter.verify((err) => {
        if (err) logger.error({ err, event: "MAILER_ERROR" }, "SMTP connection failed");
        else logger.info({ event: "MAILER_READY" }, "SMTP connection verified");
    });

    return _transporter;
}

// ─── Send helper ──────────────────────────────────────────────────────────────

export async function sendMail(
    to: string | string[],
    subject: string,
    html: string,
): Promise<SentMessageInfo> {
    return getTransporter().sendMail({
        from: env.RESEND_FROM,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html,
    });
}