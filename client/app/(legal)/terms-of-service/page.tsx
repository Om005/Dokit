import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
    title: "Terms of Service",
};

export default function TermsOfServicePage() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8 my-12 max-w-5xl">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
                    <p className="text-md mb-3 text-muted-foreground">Last updated: May 18, 2026</p>
                </div>

                <div className="max-w-none">
                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Agreement to Terms
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        By accessing or using Dokit, you agree to be bound by these Terms of
                        Service. If you do not agree to these Terms, you may not access or use the
                        Service.
                    </p>
                    <p className="leading-7 mb-6 last:mb-0">
                        These Terms apply to all visitors, users, and others who access or use
                        Dokit. Please read them carefully before using our platform.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Description of Service
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        Dokit is a cloud development workspace platform that provides:
                    </p>
                    <ul className="my-6 ml-6 space-y-2 list-disc marker:text-primary">
                        <li className="leading-7">
                            <strong className="font-semibold">Instant Workspaces</strong> - Launch
                            ready-to-run development environments in seconds.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Collaboration</strong> - Work together
                            in real time with live presence and shared editing.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Project Templates</strong> - Start
                            fast with curated stacks for Node, React, Vite, and more.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Security</strong> - Run projects in
                            isolated containers with access controls.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Automation</strong> - Configure ports,
                            previews, and dependencies without manual setup.
                        </li>
                    </ul>
                    <p className="leading-7 mb-6 last:mb-0">
                        We reserve the right to modify, suspend, or discontinue any aspect of the
                        Service at any time without prior notice.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        User Accounts
                    </h2>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Account Creation
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        To access certain features of Dokit, you must create an account. When
                        creating an account, you agree to:
                    </p>
                    <ul className="my-6 ml-6 space-y-2 list-disc marker:text-primary">
                        <li className="leading-7">
                            Provide accurate, current, and complete information
                        </li>
                        <li className="leading-7">
                            Maintain and promptly update your account information
                        </li>
                        <li className="leading-7">Keep your credentials secure</li>
                        <li className="leading-7">
                            Accept responsibility for activity under your account
                        </li>
                        <li className="leading-7">Notify us of any unauthorized use</li>
                    </ul>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Account Termination
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        You may delete your account at any time through your account settings. We
                        reserve the right to suspend or terminate your account if you:
                    </p>
                    <ul className="my-6 ml-6 space-y-2 list-disc marker:text-primary">
                        <li className="leading-7">Violate these Terms of Service</li>
                        <li className="leading-7">Engage in abusive or fraudulent behavior</li>
                        <li className="leading-7">
                            Create projects that violate our Acceptable Use Policy
                        </li>
                    </ul>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Acceptable Use Policy
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        You agree to use Dokit responsibly and lawfully. You may not use our Service
                        to host or distribute content that is illegal, harmful, or violates the
                        rights of others.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Prohibited Content
                    </h3>
                    <ul className="my-6 ml-6 space-y-2 list-disc marker:text-primary">
                        <li className="leading-7">
                            <strong className="font-semibold">Malware or Phishing</strong> -
                            Distribute malware, viruses, or phishing attempts.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Illegal Content</strong> - Host
                            content that is illegal in any applicable jurisdiction.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Harmful Content</strong> - Promote
                            violence, self-harm, or dangerous activities.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Hate Speech</strong> - Promote
                            discrimination or hatred.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Spam</strong> - Distribute unsolicited
                            or bulk messages.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Copyright Infringement</strong> - Host
                            content that infringes intellectual property rights.
                        </li>
                    </ul>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Prohibited Activities
                    </h3>
                    <ul className="my-6 ml-6 space-y-2 list-disc marker:text-primary">
                        <li className="leading-7">Attempt to bypass security measures</li>
                        <li className="leading-7">Use automated systems to abuse the Service</li>
                        <li className="leading-7">
                            Interfere with or disrupt the Service or servers
                        </li>
                        <li className="leading-7">Attempt to gain unauthorized access</li>
                        <li className="leading-7">
                            Resell or redistribute the Service without authorization
                        </li>
                    </ul>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Enforcement
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">We reserve the right to:</p>
                    <ul className="my-6 ml-6 space-y-2 list-disc marker:text-primary">
                        <li className="leading-7">
                            Disable or delete content that violates these Terms
                        </li>
                        <li className="leading-7">
                            Suspend or terminate accounts for repeated violations
                        </li>
                        <li className="leading-7">
                            Report illegal activities to appropriate authorities
                        </li>
                        <li className="leading-7">Take legal action against serious violations</li>
                    </ul>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Intellectual Property
                    </h2>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Our Intellectual Property
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Dokit and its original content, features, and functionality are owned by
                        Dokit and are protected by international copyright, trademark, patent, trade
                        secret, and other intellectual property laws.
                    </p>
                    <p className="leading-7 mb-6 last:mb-0">
                        Our trademarks, logos, and service marks may not be used without our prior
                        written consent.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Your Content
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        You retain ownership of the code and content you upload to Dokit. By using
                        our Service, you grant us a limited license to store, process, and display
                        your content for platform functionality.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        User-Generated Projects
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Projects you create are provided for your use under these Terms. You are
                        responsible for ensuring your projects comply with all applicable laws and
                        third-party rights.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Analytics and Data
                    </h2>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Analytics Collection
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        We collect operational data to provide and improve the Service, such as
                        workspace performance metrics, usage statistics, and error logs.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Data Accuracy
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        While we strive for accuracy, analytics data is provided
                        &ldquo;as-is.&rdquo; We do not guarantee the accuracy, completeness, or
                        reliability of analytics data.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Data Ownership
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Analytics data generated from your use of Dokit belongs to you. Aggregated,
                        anonymized data may be used by Dokit for service improvement and research
                        purposes.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Pricing and Payment
                    </h2>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Free Tier
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Dokit may offer a free tier with basic features. Free tier usage is subject
                        to workspace limits, retention policies, and feature restrictions.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Paid Plans
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Paid plans may be available with additional features. If you subscribe to a
                        paid plan:
                    </p>
                    <ul className="my-6 ml-6 space-y-2 list-disc marker:text-primary">
                        <li className="leading-7">
                            Fees are billed in advance on a recurring basis
                        </li>
                        <li className="leading-7">
                            You authorize us to charge your payment method
                        </li>
                        <li className="leading-7">Prices may change with reasonable notice</li>
                        <li className="leading-7">
                            Refunds are handled according to our refund policy
                        </li>
                    </ul>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Cancellation
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        You may cancel your subscription at any time. Upon cancellation, your
                        account will revert to the free tier at the end of your billing period.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Disclaimers
                    </h2>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Service Availability
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Dokit is provided &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; without
                        warranties of any kind. We do not warrant that the Service will be
                        uninterrupted, secure, or error-free.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Workspace Reliability
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        While we strive for high availability, we cannot guarantee that workspaces
                        will always be accessible. Network issues and maintenance may affect
                        availability.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Third-Party Services
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Dokit may integrate with third-party services. We are not responsible for
                        the content, accuracy, or availability of those services.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Limitation of Liability
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        To the maximum extent permitted by law, Dokit and its officers, directors,
                        employees, and agents shall not be liable for any indirect, incidental,
                        special, consequential, or punitive damages, or any loss of profits, data,
                        or goodwill.
                    </p>
                    <p className="leading-7 mb-6 last:mb-0">
                        Some jurisdictions do not allow certain limitations of liability, so some
                        limitations may not apply to you.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Indemnification
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        You agree to indemnify, defend, and hold harmless Dokit and its officers,
                        directors, employees, contractors, agents, licensors, and suppliers from any
                        claims, liabilities, damages, losses, costs, or expenses (including
                        reasonable attorneys&rsquo; fees) arising from your use of the Service or
                        your violation of these Terms.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Privacy
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        Your use of Dokit is also governed by our Privacy Policy. By using the
                        Service, you consent to the collection and use of information as described
                        in our Privacy Policy.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Changes to Terms
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        We may modify these Terms at any time. Material changes will be communicated
                        by posting the updated Terms on our website. Continued use of the Service
                        after changes constitutes acceptance of the modified Terms.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Governing Law
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        These Terms shall be governed by and construed in accordance with the laws
                        of the jurisdiction in which Dokit operates, without regard to conflict of
                        law principles.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Dispute Resolution
                    </h2>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Informal Resolution
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Before filing a formal dispute, you agree to first contact us to attempt to
                        resolve the dispute informally.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Binding Arbitration
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        If informal resolution fails, any disputes arising from these Terms or the
                        Service shall be resolved through binding arbitration, except for disputes
                        that qualify for small claims court.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Class Action Waiver
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        You agree that any disputes will be resolved on an individual basis. You
                        waive the right to participate in class actions or class arbitrations.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Severability
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        If any provision of these Terms is found to be unenforceable, the remaining
                        provisions will continue in full force and effect.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Waiver
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        Our failure to enforce any provision of these Terms shall not constitute a
                        waiver of that provision or any other provision.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Entire Agreement
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        These Terms, together with our Privacy Policy, constitute the entire
                        agreement between you and Dokit regarding the use of the Service.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Contact Us
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        If you have questions about this Terms of Service, contact us at{" "}
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
