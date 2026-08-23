"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { motion, useReducedMotion } from "framer-motion";

export function HeroSection() {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const shouldReduceMotion = useReducedMotion();

    const ease = [0.215, 0.61, 0.355, 1] as [number, number, number, number];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease },
        },
    };

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-24 hero-gradient overflow-hidden">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col items-center z-10 w-full"
            >
                {/* Version Badge */}
                <motion.div
                    variants={itemVariants}
                    className="flex items-center gap-2 px-4 py-1.5 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full mb-8 shadow-sm"
                >
                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    <span className="text-sm text-muted-foreground">Dokit is now live</span>
                </motion.div>

                {/* Title with gradient shade */}
                <motion.h1
                    variants={itemVariants}
                    className="text-5xl md:text-7xl font-bold text-center leading-tight mb-6 text-balance max-w-4xl"
                >
                    <span className="bg-gradient-to-b from-foreground via-foreground to-muted-foreground/50 bg-clip-text text-transparent">
                        Code together.
                    </span>
                    <br />
                    <span className="bg-gradient-to-b from-foreground via-foreground/80 to-muted-foreground/40 bg-clip-text text-transparent">
                        Ship faster.
                    </span>
                </motion.h1>

                {/* Description */}
                <motion.p
                    variants={itemVariants}
                    className="text-lg md:text-xl text-muted-foreground text-center max-w-2xl mb-10 leading-relaxed text-pretty"
                >
                    Dokit is the zero-latency collaborative code editor for teams. Spin up a dev
                    environment in seconds, share a link, and build together in real-time.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row items-center gap-4"
                >
                    <Button asChild size="lg" className="rounded-lg px-8 h-12 text-base">
                        <Link href={isAuthenticated ? "/dashboard" : "/signup"}>
                            {isAuthenticated ? "Go to Workspace" : "Sign Up"}
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="rounded-lg px-8 h-12 text-base bg-transparent"
                    >
                        <Link href="/features">Explore Features</Link>
                    </Button>
                </motion.div>
            </motion.div>

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background"
            />
        </section>
    );
}
