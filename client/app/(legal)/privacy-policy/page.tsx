import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
    title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8 my-12 max-w-5xl">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                    <p className="text-md mb-3 text-muted-foreground">Last updated: May 18, 2026</p>
                </div>

                <div className="max-w-none">
                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Overview
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        Dokit is a cloud development workspace platform. We collect information to
                        provide the Service, keep workspaces secure, and improve performance. This
                        policy applies to all visitors, users, and others who access or use Dokit.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Information We Collect
                    </h2>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Account Information
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        When you create an account, we collect details such as your name, email
                        address, username, and authentication credentials.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Workspace Content
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        We store the files, code, and configuration you upload or generate inside
                        your workspaces. You control what you upload and can delete your content at
                        any time.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Usage and Diagnostics
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        We collect operational data such as workspace performance metrics, feature
                        usage, error logs, and audit events to keep Dokit reliable and secure.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Device and Cookie Data
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        We use cookies and similar technologies to maintain sessions, remember
                        preferences, and analyze usage. This may include device identifiers, IP
                        addresses, and browser information.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        How We Use Information
                    </h2>
                    <ul className="my-6 ml-6 space-y-2 list-disc marker:text-primary">
                        <li className="leading-7">Provide and operate the Service.</li>
                        <li className="leading-7">
                            Secure workspaces and enforce access controls.
                        </li>
                        <li className="leading-7">
                            Improve performance, reliability, and usability.
                        </li>
                        <li className="leading-7">Respond to support requests and inquiries.</li>
                        <li className="leading-7">Send important product and policy updates.</li>
                    </ul>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        How We Share Information
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        We do not sell your personal information. We may share data with trusted
                        service providers who help us operate Dokit, such as hosting, analytics, and
                        customer support vendors.
                    </p>
                    <ul className="my-6 ml-6 space-y-2 list-disc marker:text-primary">
                        <li className="leading-7">
                            To comply with legal obligations or lawful requests.
                        </li>
                        <li className="leading-7">
                            To protect the rights and safety of Dokit and our users.
                        </li>
                        <li className="leading-7">
                            In connection with a merger, acquisition, or sale of assets.
                        </li>
                    </ul>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Data Retention
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        We retain your information for as long as your account is active or as
                        needed to provide the Service. You may delete your account and content at
                        any time, subject to legal or operational retention requirements.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Security
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        We use industry-standard security practices to protect your information,
                        including encryption in transit and access controls. No system is completely
                        secure, so we cannot guarantee absolute security.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Your Choices and Rights
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        You can update your account information, access your data, or delete your
                        account through your profile settings. Depending on your location, you may
                        have additional rights to access, correct, or delete your personal data.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Cookies and Analytics
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        Dokit uses cookies for authentication and preferences. We may also use
                        analytics tools to understand product usage and improve the Service. You can
                        manage cookie preferences in your browser settings.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Children’s Privacy
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        Dokit is not intended for children under 13. If we learn that we have
                        collected personal information from a child under 13, we will delete it.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Changes to This Policy
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        We may update this Privacy Policy from time to time. Material changes will
                        be posted on this page. Continued use of the Service after changes
                        constitutes acceptance of the updated policy.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Contact Us
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        If you have questions about this Privacy Policy, contact us at{" "}
                        <Link
                            className="font-medium underline underline-offset-4 hover:text-primary/75 transition-colors"
                            href="mailto:chavdaom84@gmail.com"
                        >
                            chavdaom84@gmail.com
                        </Link>{" "}
                        or visit our{" "}
                        <Link
                            className="font-medium underline underline-offset-4 hover:text-primary/75 transition-colors"
                            href="/contact-us"
                        >
                            contact page
                        </Link>
                        .
                    </p>
                </div>
            </div>

            <Footer />
        </main>
    );
}
