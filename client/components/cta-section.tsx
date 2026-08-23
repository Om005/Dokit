"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { motion, useReducedMotion } from "framer-motion";

export function CTASection() {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const shouldReduceMotion = useReducedMotion();

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: [0.215, 0.61, 0.355, 1] as [number, number, number, number],
                staggerChildren: 0.15,
                when: "beforeChildren",
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.215, 0.61, 0.355, 1] as [number, number, number, number],
            },
        },
    };

    return (
        <section className="relative py-24 px-4 bg-gradient-to-b from-background to-muted/50 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="text-center p-8 md:p-16 rounded-3xl border border-border/50 bg-card/80 backdrop-blur-md shadow-2xl shadow-black/10"
                >
                    <motion.div
                        variants={itemVariants}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-6"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Free to get started</span>
                    </motion.div>

                    <motion.h2
                        variants={itemVariants}
                        className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
                    >
                        Ready to Drop Your
                        <br />
                        <span className="text-primary">Local Setup?</span>
                    </motion.h2>

                    <motion.p
                        variants={itemVariants}
                        className="text-muted-foreground text-lg max-w-xl mx-auto mb-8"
                    >
                        Join thousands of developers who have already made the switch to
                        cloud-native development with Dokit.
                    </motion.p>

                    <motion.div variants={itemVariants}>
                        <Button
                            asChild
                            size="lg"
                            className="rounded-xl px-10 h-14 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                        >
                            <Link
                                href={isAuthenticated ? "/dashboard/projects" : "/signup"}
                                className="flex items-center gap-2"
                            >
                                Create Workspace
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-8 border-t border-border/50"
                    >
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            No credit card required
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Instant setup
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Free tier available
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
