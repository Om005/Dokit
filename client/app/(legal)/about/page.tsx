import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
    title: "About",
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8 my-12 max-w-5xl">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">About Dokit</h1>
                </div>

                <div className="max-w-none">
                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Our Mission
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        Dokit exists to remove the friction from cloud development. We believe teams
                        should be able to spin up consistent, collaborative workspaces in seconds,
                        without compromising security, performance, or flexibility.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Our Story
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        Dokit started as an effort to solve common pain points in modern software
                        teams: slow onboarding, environment drift, and hard-to-share local
                        development setups. We combined a Next.js client, an Express backend, and
                        Docker-based runtime provisioning to make cloud workspaces feel as fast as
                        local development.
                    </p>
                    <p className="leading-7 mb-6 last:mb-0">
                        What began as a faster way to share projects grew into a full collaboration
                        platform with real-time editing, bidirectional file sync, and secure
                        previews. Today, Dokit helps teams build, ship, and iterate with confidence.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        What We Offer
                    </h2>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Instant Cloud Workspaces
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Launch isolated Linux environments in seconds with ready-to-run project
                        templates for Node, React, Vite, and more.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Real-Time Collaboration
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Yjs-powered CRDT sync keeps everyone on the same page with live cursors,
                        presence, and shared editing.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Persistent Storage
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Workspaces stay safe with automatic backups to Cloudflare R2 and real-time
                        file mirroring via inotify and Socket.IO.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Secure Infrastructure
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Each project runs in a resource-capped Docker container with RBAC, 2FA, and
                        strict access controls enforced at the API and proxy layers.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Dynamic Tooling
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Install runtime dependencies like Python, Go, Rust, or Java on demand, right
                        inside the workspace.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        GitHub Imports
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Import public repositories and get a full development environment without
                        manual setup.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Why Choose Dokit?
                    </h2>
                    <ul className="my-6 ml-6 space-y-2 list-disc marker:text-primary">
                        <li className="leading-7">
                            <strong className="font-semibold">Speed:</strong> Workspace templates
                            and optimized containers boot in seconds.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Consistency:</strong> Every
                            environment is reproducible and isolated.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Collaboration:</strong> Edit together
                            in real time without merge conflicts.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Security:</strong> RBAC, 2FA, and rate
                            limiting protect your projects.
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Reliability:</strong> Automatic
                            backups and sync keep your work safe.
                        </li>
                    </ul>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Our Values
                    </h2>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Developer-First
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        We build Dokit with developer workflows in mind, prioritizing speed and
                        simplicity over complexity.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Security by Default
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        Isolation, and authenticationare built into every layer of the platform.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Reliability
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        From infrastructure to backups, we focus on dependable, predictable
                        performance.
                    </p>

                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4 first:mt-0">
                        Community
                    </h3>
                    <p className="leading-7 mb-6 last:mb-0">
                        We are building a shared space where teams learn from each other and ship
                        better software together.
                    </p>

                    <h2 className="scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight mt-12 mb-6 first:mt-0">
                        Contact Us
                    </h2>
                    <p className="leading-7 mb-6 last:mb-0">
                        We would love to hear from you. Reach out with feedback, questions, or
                        collaboration ideas.
                    </p>
                    <ul className="my-6 ml-6 space-y-2 list-disc marker:text-primary">
                        <li className="leading-7">
                            <strong className="font-semibold">LinkedIn:</strong>{" "}
                            <a
                                className="font-medium underline underline-offset-4 hover:text-primary/75 transition-colors"
                                href="https://www.linkedin.com/in/om-chavda-06a390302/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Om Chavda
                            </a>
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">Email:</strong>{" "}
                            <a
                                className="font-medium underline underline-offset-4 hover:text-primary/75 transition-colors"
                                href="mailto:chavdaom84@gmail.com"
                            >
                                chavdaom84@gmail.com
                            </a>
                        </li>
                        <li className="leading-7">
                            <strong className="font-semibold">GitHub:</strong>{" "}
                            <a
                                className="font-medium underline underline-offset-4 hover:text-primary/75 transition-colors"
                                href="https://github.com/Om005"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                github.com/Om005
                            </a>
                        </li>
                    </ul>
                    <p className="leading-7 mb-6 last:mb-0">
                        Join the teams who build and collaborate faster with Dokit.
                    </p>
                </div>
            </div>

            <Footer />
        </main>
    );
}
