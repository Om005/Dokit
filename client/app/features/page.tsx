"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
    Activity,
    Box,
    Cloud,
    ChevronDown,
    Database,
    GitBranch,
    Globe,
    HardDrive,
    KeyRound,
    Lock,
    Monitor,
    Network,
    Server,
    ShieldCheck,
    Terminal,
    Users,
    Wrench,
    Brain,
    MessageSquare,
    Zap,
    Sparkles,
    Link2,
    Clock,
} from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

type FeatureItem = {
    icon: LucideIcon;
    title: string;
    description: string;
};

const coreFeatures: FeatureItem[] = [
    {
        icon: GitBranch,
        title: "GitHub imports",
        description: "Clone public repos into ready-to-run workspaces in seconds.",
    },
    {
        icon: Wrench,
        title: "Dynamic tooling",
        description: "Install Python, Go, Rust, Java, or utilities with one click.",
    },
    {
        icon: Terminal,
        title: "Integrated terminal",
        description: "Run commands, start servers, and inspect logs in-browser.",
    },
    {
        icon: Globe,
        title: "Live previews",
        description: "Expose running apps with secure preview URLs instantly.",
    },
    {
        icon: HardDrive,
        title: "Persistent storage",
        description: "Workspace data is synced and backed up to Cloudflare R2.",
    },
    {
        icon: Box,
        title: "Isolated containers",
        description: "Every project runs in a resource-capped Docker container.",
    },
];

const collaborationFeatures: FeatureItem[] = [
    {
        icon: Users,
        title: "Multiplayer editing",
        description: "Yjs-powered CRDT sync keeps edits consistent for teams.",
    },
    {
        icon: Activity,
        title: "Presence and cursors",
        description: "See who is active, where they are, and what they are editing.",
    },
    {
        icon: Network,
        title: "Realtime file sync",
        description: "File tree changes stream instantly across every collaborator.",
    },
];

const codeLinkFeatures: FeatureItem[] = [
    {
        icon: Link2,
        title: "Instant Snippet Sharing",
        description: "Generate secure, shareable links for individual code snippets directly.",
    },
    {
        icon: Lock,
        title: "Password Protection",
        description: "Optionally restrict snippet viewing access with password.",
    },
    {
        icon: Users,
        title: "Access Control Lists",
        description: "Restrict visibility to a predefined list of allowed email addresses.",
    },
    {
        icon: Clock,
        title: "Automated Expiration",
        description: "Set self-destruction datetimes for transient or temporary snippets.",
    },
];

const securityFeatures: FeatureItem[] = [
    {
        icon: ShieldCheck,
        title: "Role-based access",
        description: "Control read, write, and owner permissions per project.",
    },
    {
        icon: KeyRound,
        title: "Two-factor security",
        description: "TOTP-based 2FA with backup codes protects every account.",
    },
    {
        icon: Lock,
        title: "API protection",
        description: "Redis-backed rate limiting shields your API endpoints.",
    },
];

const aiAssistantFeatures: FeatureItem[] = [
    {
        icon: Brain,
        title: "Project-aware intelligence",
        description: "ASTra understands your entire project codebase and context.",
    },
    {
        icon: MessageSquare,
        title: "Natural code questions",
        description: "Ask anything about your project and get instant, contextual answers.",
    },
    {
        icon: Zap,
        title: "Real-time assistance",
        description: "Get help with debugging, documentation, and architectural decisions.",
    },
    {
        icon: Sparkles,
        title: "Smart suggestions",
        description: "Powered by RAG — answers grounded in your actual code, not generic guesses.",
    },
];

const runtimeFeatures: FeatureItem[] = [
    {
        icon: Server,
        title: "Dynamic provisioning",
        description: "Create and tear down environments on demand via Docker.",
    },
    {
        icon: Cloud,
        title: "Proxy routing",
        description: "Nginx routing handles previews and WebSocket terminals.",
    },
    {
        icon: Monitor,
        title: "Secure terminals",
        description: "Run shell sessions over WebSockets with access validation.",
    },
];

const automationFeatures: FeatureItem[] = [
    {
        icon: Database,
        title: "Background pipelines",
        description: "BullMQ handles sync, backups, and long-running jobs.",
    },
    {
        icon: Wrench,
        title: "Workspace templates",
        description: "Starter stacks for Node, Express, React, and Vite.",
    },
];

const experienceFeatures: FeatureItem[] = [
    {
        icon: Terminal,
        title: "One-click boot",
        description: "Start a project with a single action and code immediately.",
    },
    {
        icon: Users,
        title: "Shareable access",
        description: "Invite collaborators or review-only guests in seconds.",
    },
    {
        icon: Globe,
        title: "Preview sharing",
        description: "Share live app previews without exposing your machine.",
    },
    {
        icon: HardDrive,
        title: "Reliable recovery",
        description: "Restore workspaces from synced storage at any time.",
    },
    {
        icon: ShieldCheck,
        title: "Session control",
        description: "Revoke sessions remotely and monitor access activity.",
    },
    {
        icon: GitBranch,
        title: "Project onboarding",
        description: "Bring existing repos or start from curated templates.",
    },
];

const faqs = [
    {
        question: "How fast can I start a workspace?",
        answer: "Most templates boot in under 10 seconds, including container startup and file sync.",
    },
    {
        question: "Can I collaborate with my team in real time?",
        answer: "Yes. Dokit uses Yjs and WebSockets for shared edits, cursors, and presence.",
    },
    {
        question: "What runtimes can I install?",
        answer: "You can install popular stacks like Python, Go, Rust, Java, and Node on demand.",
    },
    {
        question: "How is my data protected?",
        answer: "Workspaces run in isolated containers, and data is backed up to Cloudflare R2.",
    },
    {
        question: "Do you support private projects?",
        answer: "Yes. Access is managed with RBAC permissions and optional 2FA.",
    },
    {
        question: "How do previews work?",
        answer: "Dokit routes preview traffic through Nginx with secure access checks.",
    },
    {
        question: "What is ASTra?",
        answer: "ASTra is your project-aware AI assistant. It has full access to your codebase and can answer questions, help with debugging, suggest improvements, and assist with architectural decisions.",
    },
    {
        question: "Can ASTra understand my entire project?",
        answer: "Yes. ASTra analyzes your complete codebase, dependencies, and structure to provide contextual, accurate assistance tailored to your project.",
    },
    {
        question: "What can I ask ASTra?",
        answer: "You can ask anything related to your project—from code explanations and debugging help to best practices, refactoring suggestions, and implementation guidance.",
    },
    {
        question: "How does ASTra access my project files?",
        answer: "ASTra has secure, read-only access to your project workspace. It analyzes files only when you ask a question and respects your project's privacy.",
    },
    {
        question: "What are Code Links?",
        answer: "Code Links let you quickly share independent code snippets without creating a full project workspace. They can be protected with passwords, expirations, and access lists.",
    },
    {
        question: "Can I edit a Code Link after generating it?",
        answer: "Yes. If you are the owner of the Code Link, you can toggle edit mode directly from the snippet viewer page to update the code or change settings.",
    },
];

export default function FeaturesPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleToggle = (index: number) => {
        setOpenIndex((current) => (current === index ? null : index));
    };

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="flex flex-col bg-background w-full max-w-5xl mx-auto px-4 py-8 my-12">
                <section className="w-full max-w-6xl mx-auto border-b border-border bg-muted/10 py-16 md:py-24">
                    <div className="container px-4">
                        <div className="mx-auto max-w-3xl text-center">
                            <h1 className="mb-4 text-balance text-4xl font-bold md:text-5xl">
                                Comprehensive Features
                            </h1>
                            <p className="text-pretty text-lg text-muted-foreground leading-relaxed">
                                Everything you need to build, collaborate, and ship from a secure
                                cloud workspace.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="w-full max-w-6xl mx-auto container px-4 py-16">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-3xl font-bold">Instant Environments</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Provision, launch, and run code without local setup.
                                </p>
                            </div>
                            <Button asChild className="rounded-lg px-4 py-2">
                                <Link href="/dashboard/projects">Start a project</Link>
                            </Button>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {coreFeatures.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
                                >
                                    <feature.icon className="mb-3 h-8 w-8 text-primary" />
                                    <h3 className="text-base font-semibold leading-snug">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="w-full max-w-6xl mx-auto border-y border-border bg-muted/10 py-16">
                    <div className="container px-4">
                        <div className="mx-auto max-w-6xl">
                            <div className="mb-12">
                                <h2 className="mb-4 text-3xl font-bold">Team Collaboration</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Work together with shared context, files, and live presence.
                                </p>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {collaborationFeatures.map((feature) => (
                                    <div
                                        key={feature.title}
                                        className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
                                    >
                                        <feature.icon className="mb-3 h-8 w-8 text-primary" />
                                        <h3 className="text-base font-semibold leading-snug">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {feature.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="w-full max-w-6xl mx-auto border-y border-border bg-muted/10 py-16">
                    {/* <section className="w-full max-w-6xl mx-auto border-y border-border bg-gradient-to-br from-primary/5 via-background to-primary/5 py-16"> */}
                    <div className="container px-4">
                        <div className="mx-auto max-w-6xl">
                            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold">AI-Powered Assistance</h2>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        Meet ASTra—your intelligent project assistant with full
                                        codebase access.
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                                {aiAssistantFeatures.map((feature) => (
                                    <div
                                        key={feature.title}
                                        className="rounded-xl border border-border/50 bg-card/90 p-5 shadow-sm"
                                    >
                                        <feature.icon className="mb-3 h-8 w-8 text-primary" />
                                        <h3 className="text-base font-semibold leading-snug">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {feature.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="w-full max-w-6xl mx-auto container px-4 py-16">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-3xl font-bold">Secure Snippet Sharing</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Share individual files or snippets instantly with advanced
                                    security parameters.
                                </p>
                            </div>
                            <Button asChild className="rounded-lg px-4 py-2">
                                <Link href="/dashboard/codelink/generate">Create a Code Link</Link>
                            </Button>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {codeLinkFeatures.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
                                >
                                    <feature.icon className="mb-3 h-8 w-8 text-primary" />
                                    <h3 className="text-base font-semibold leading-snug">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* <section className="w-full max-w-6xl mx-auto container px-4 py-16"> */}
                <section className="w-full max-w-6xl mx-auto border-y border-border bg-gradient-to-br from-primary/5 via-background to-primary/5 py-16">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-12">
                            <h2 className="mb-4 text-3xl font-bold">Security and Access</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Protect every workspace with layered security controls.
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {securityFeatures.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
                                >
                                    <feature.icon className="mb-3 h-8 w-8 text-primary" />
                                    <h3 className="text-base font-semibold leading-snug">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* <section className="w-full max-w-6xl mx-auto border-y border-border bg-gradient-to-br from-primary/5 via-background to-primary/5 py-16"> */}
                <section className="w-full max-w-6xl mx-auto container px-4 py-16">
                    <div className="container px-4">
                        <div className="mx-auto max-w-6xl">
                            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold">Runtime and Networking</h2>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        Fast routing, secure terminals, and reliable previews.
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {runtimeFeatures.map((feature) => (
                                    <div
                                        key={feature.title}
                                        className="rounded-xl border border-border/50 bg-card/90 p-5 shadow-sm"
                                    >
                                        <feature.icon className="mb-3 h-8 w-8 text-primary" />
                                        <h3 className="text-base font-semibold leading-snug">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {feature.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* <section className="w-full max-w-6xl mx-auto container px-4 py-16"> */}
                <section className="w-full max-w-6xl mx-auto border-y border-border bg-gradient-to-br from-primary/5 via-background to-primary/5 py-16">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-12">
                            <h2 className="mb-4 text-3xl font-bold">Automation and Ops</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Keep workspaces healthy with background orchestration.
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {automationFeatures.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
                                >
                                    <feature.icon className="mb-3 h-8 w-8 text-primary" />
                                    <h3 className="text-base font-semibold leading-snug">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* <section className="w-full max-w-6xl mx-auto border-y border-border bg-gradient-to-br from-primary/5 via-background to-primary/5 py-16"> */}
                <section className="w-full max-w-6xl mx-auto container px-4 py-16">
                    <div className="container px-4">
                        <div className="mx-auto max-w-6xl">
                            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold">Developer Experience</h2>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        A workflow designed for focus, speed, and reliability.
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {experienceFeatures.map((feature) => (
                                    <div
                                        key={feature.title}
                                        className="rounded-xl border border-border/50 bg-card/90 p-5 shadow-sm"
                                    >
                                        <feature.icon className="mb-3 h-8 w-8 text-primary" />
                                        <h3 className="text-base font-semibold leading-snug">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {feature.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="w-full max-w-6xl mx-auto container px-4 py-16 md:py-24">
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold">Frequently Asked Questions</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Answers to common questions about Dokit.
                            </p>
                        </div>
                        <div className="flex flex-col w-full">
                            {faqs.map((faq, index) => {
                                const isOpen = openIndex === index;
                                return (
                                    <div
                                        key={faq.question}
                                        className="border-b border-border/50 py-3"
                                    >
                                        <button
                                            type="button"
                                            className="flex w-full items-center justify-between gap-3 text-left text-md font-medium text-foreground"
                                            aria-expanded={isOpen}
                                            aria-controls={`faq-panel-${index}`}
                                            id={`faq-trigger-${index}`}
                                            onClick={() => handleToggle(index)}
                                        >
                                            <span>{faq.question}</span>
                                            <ChevronDown
                                                className={`h-4 w-4 transition-transform duration-300 ${
                                                    isOpen ? "rotate-180" : "rotate-0"
                                                }`}
                                            />
                                        </button>
                                        <div
                                            id={`faq-panel-${index}`}
                                            role="region"
                                            aria-labelledby={`faq-trigger-${index}`}
                                            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                                                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                            }`}
                                        >
                                            <div className="overflow-hidden">
                                                <p
                                                    className={`mt-3 text-md text-muted-foreground transition-opacity duration-300 ${
                                                        isOpen ? "opacity-100" : "opacity-0"
                                                    }`}
                                                >
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>

            <Footer />
        </main>
    );
}
