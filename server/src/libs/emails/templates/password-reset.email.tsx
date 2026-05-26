// src/libs/emails/templates/password-reset.email.tsx
import { Text, Button, Heading } from "@react-email/components";
import { BaseLayout } from "./base.layout.js";

export interface PasswordResetEmailProps {
    recipientName: string;
    resetUrl: string;
    expiresInMinutes: number;
}

export default function PasswordResetEmail({ recipientName, resetUrl, expiresInMinutes }: PasswordResetEmailProps) {
    return (
        <BaseLayout>
            <Heading>Password Reset Request</Heading>
            <Text>Hi {recipientName}, we received a request to reset your password.</Text>
            <Button href={resetUrl} style={{ backgroundColor: "#000", color: "#fff", padding: "12px 24px" }}>
                Reset Password
            </Button>
            <Text style={{ color: "#999" }}>This link expires in {expiresInMinutes} minutes.</Text>
            <Text>If you didn't request this, you can safely ignore this email.</Text>
        </BaseLayout>
    );
}