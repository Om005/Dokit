"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export function HeroSection() {
    const { isAuthenticated, email, username } = useSelector((state: RootState) => state.auth);
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 hero-gradient">
            {/* Version Badge */}
            <div className="flex items-center gap-2 px-4 py-1.5 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full mb-8 shadow-sm">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">v1.0 is now live</span>
            </div>

            {/* Title with gradient shade */}
            <h1 className="text-5xl md:text-7xl font-bold text-center leading-tight mb-6 text-balance">
                <span className="bg-gradient-to-b from-foreground via-foreground to-muted-foreground/50 bg-clip-text text-transparent">
                    Code together.
                </span>
                <br />
                <span className="bg-gradient-to-b from-foreground via-foreground/80 to-muted-foreground/40 bg-clip-text text-transparent">
                    Ship faster.
                </span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground text-center max-w-2xl mb-10 leading-relaxed text-pretty">
                Dokit is the zero-latency collaborative code editor for teams. Spin up a dev
                environment in seconds, share a link, and build together in real-time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button asChild size="lg" className="rounded-lg px-8 h-12 text-base">
                    <Link href="/signup">Create Sandbox</Link>
                </Button>
                <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-lg px-8 h-12 text-base bg-transparent"
                >
                    <Link href="#demo">View Demo</Link>
                </Button>
            </div>
        </section>
    );
}
