// src/libs/emails/templates/welcome.email.tsx
import { Text, Button, Heading } from "@react-email/components";
import { BaseLayout } from "./base.layout.js";

export interface WelcomeEmailProps {
    recipientName: string;
    loginUrl: string;
    verificationUrl: string;
}

export default function WelcomeEmail({ recipientName, loginUrl, verificationUrl }: WelcomeEmailProps) {
    return (
        <BaseLayout>
            <Heading>Welcome to Sneakr, {recipientName}!</Heading>
            <Text>Thanks for signing up. Please verify your email to get started.</Text>
            <Button href={verificationUrl} style={{ backgroundColor: "#000", color: "#fff", padding: "12px 24px" }}>
                Verify Email
            </Button>
            <Text>Or log in directly:</Text>
            <Button href={loginUrl}>Log In</Button>
        </BaseLayout>
    );
}