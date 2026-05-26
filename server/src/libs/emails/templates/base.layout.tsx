// src/libs/emails/templates/base.layout.tsx
import { Html, Head, Body, Container, Img, Hr, Text } from "@react-email/components";

export function BaseLayout({ children }: { children: React.ReactNode }) {
    return (
        <Html>
            <Head />
            <Body style={{ backgroundColor: "#f4f4f4", fontFamily: "sans-serif" }}>
                <Container style={{ backgroundColor: "#fff", padding: "32px", borderRadius: "8px", display: "flex", justifyContent: "center"}}>
                    {/* <Img src="https://sneakr.com/logo.png" alt="Sneakr" height={40} /> */}
                    <span style={{ fontWeight: "bold", fontSize: "24px", textAlign: "center" }}>Sneakr</span>
                    <Hr />
                    {children}
                    <Hr />
                    <Text style={{ color: "#999", fontSize: "12px" }}>
                        © 2026 Sneakr. All rights reserved.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}