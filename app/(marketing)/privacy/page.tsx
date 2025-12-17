import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Privacy Policy - MeganAi",
    description: "Privacy policy for MeganAi",
}

export default function PrivacyPage() {
    return (
        <div className="container max-w-4xl py-12">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

            <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-muted-foreground">Last updated: December 2024</p>

                <h2>Information We Collect</h2>
                <p>
                    When you use MeganAi, we collect information necessary to provide our services, including:
                </p>
                <ul>
                    <li>Account information (email, name)</li>
                    <li>Project data and generated code</li>
                    <li>Usage analytics</li>
                </ul>

                <h2>How We Use Your Information</h2>
                <p>We use the collected information to:</p>
                <ul>
                    <li>Provide and improve our AI code generation services</li>
                    <li>Communicate with you about your account</li>
                    <li>Analyze usage patterns to enhance user experience</li>
                </ul>

                <h2>Data Security</h2>
                <p>
                    We implement industry-standard security measures to protect your data. All communications
                    are encrypted, and we never share your code with third parties.
                </p>

                <h2>Your Rights</h2>
                <p>You have the right to:</p>
                <ul>
                    <li>Access your personal data</li>
                    <li>Request data deletion</li>
                    <li>Export your projects</li>
                    <li>Opt out of analytics</li>
                </ul>

                <h2>Contact Us</h2>
                <p>
                    For privacy-related questions, contact us at:{" "}
                    <a href="mailto:privacy@meganai.dev" className="text-primary hover:underline">
                        privacy@meganai.dev
                    </a>
                </p>
            </div>
        </div>
    )
}
