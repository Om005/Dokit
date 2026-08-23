"use client";

import { motion, useReducedMotion } from "framer-motion";

export function CodeEditorSection() {
    const shouldReduceMotion = useReducedMotion();

    const containerVariants = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.215, 0.61, 0.355, 1] as [number, number, number, number],
                when: "beforeChildren",
                staggerChildren: 0.3,
            },
        },
    };

    return (
        <section className="relative py-24 px-4 flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/30">
            <div className="w-full max-w-4xl">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <span className="text-sm text-muted-foreground font-mono">
                            main.tsx — Dokit
                        </span>
                        <div className="w-16" />
                    </div>

                    <div className="p-6 font-mono text-sm leading-7 overflow-x-auto">
                        <div className="flex">
                            <div className="flex flex-col items-end pr-6 text-muted-foreground select-none">
                                {Array.from({ length: 10 }, (_, i) => (
                                    <span key={i}>{i + 1}</span>
                                ))}
                            </div>
                            <pre className="flex-1">
                                <code>
                                    <span className="text-[#c678dd]">import</span>
                                    <span className="text-foreground"> React </span>
                                    <span className="text-[#c678dd]">from</span>
                                    <span className="text-[#98c379]"> &apos;react&apos;</span>
                                    <span className="text-foreground">;</span>
                                    {"\n"}
                                    <span className="text-[#c678dd]">export</span>
                                    <span className="text-[#c678dd]"> default</span>
                                    <span className="text-[#c678dd]"> function</span>
                                    <span className="text-[#61afef]"> App</span>
                                    <span className="text-foreground">{"()"}</span>
                                    <span className="text-foreground"> {"{"}</span>
                                    {"\n"}
                                    <span className="text-foreground">{"  "}</span>
                                    <span className="text-[#c678dd]">return</span>
                                    <span className="text-foreground"> (</span>
                                    {"\n"}
                                    <span className="text-foreground">{"    "}</span>
                                    <span className="text-muted">{"<"}</span>
                                    <span className="text-[#e06c75]">div</span>
                                    <span className="text-[#d19a66]"> className</span>
                                    <span className="text-foreground">=</span>
                                    <span className="text-[#98c379]">&quot;hero&quot;</span>
                                    <CollaboratorCursor name="You" color="#3b82f6" />
                                    <span className="text-[#98c379]">&quot;</span>
                                    <span className="text-muted">{">"}</span>
                                    {"\n"}
                                    <span className="text-foreground">{"      "}</span>
                                    <span className="text-muted">{"<"}</span>
                                    <span className="text-[#e06c75]">h1</span>
                                    <span className="text-muted">{">"}</span>
                                    <span className="text-foreground">Hello Dokit!</span>
                                    <span className="text-muted">{"</"}</span>
                                    <span className="text-[#e06c75]">h1</span>
                                    <span className="text-muted">{">"}</span>
                                    <span className="text-primary">|</span>
                                    <CollaboratorCursor name="Sarah" color="#8b5cf6" />
                                    {"\n"}
                                    <span className="text-foreground">{"      "}</span>
                                    <span className="text-muted">{"<"}</span>
                                    <span className="text-[#e06c75]">p</span>
                                    <span className="text-muted">{">"}</span>
                                    <span className="text-foreground">
                                        Collaborating in real-time...
                                    </span>
                                    <span className="text-[#8b5cf6]">|</span>
                                    <span className="text-muted">{"</"}</span>
                                    <span className="text-[#e06c75]">p</span>
                                    <span className="text-muted">{">"}</span>
                                    {"\n"}
                                    <span className="text-foreground">{"    "}</span>
                                    <span className="text-muted">{"</"}</span>
                                    <span className="text-[#e06c75]">div</span>
                                    <span className="text-muted">{">"}</span>
                                    {"\n"}
                                    <span className="text-foreground">{"  )"}</span>
                                    <span className="text-foreground">;</span>
                                    {"\n"}
                                    <span className="text-foreground">{"}"}</span>
                                </code>
                            </pre>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function CollaboratorCursor({ name, color }: { name: string; color: string }) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.span
            className="relative inline-block"
            variants={{
                hidden: { opacity: 0, scale: 0 },
                visible: {
                    opacity: 1,
                    scale: 1,
                    transition: {
                        type: shouldReduceMotion ? "tween" : "spring",
                        stiffness: 300,
                        damping: 20,
                        duration: shouldReduceMotion ? 0.3 : undefined,
                        ease: shouldReduceMotion
                            ? ([0.215, 0.61, 0.355, 1] as [number, number, number, number])
                            : undefined,
                    },
                },
            }}
        >
            <span
                className="absolute -top-5 left-0 px-2 py-0.5 text-xs text-white rounded font-sans whitespace-nowrap"
                style={{ backgroundColor: color }}
            >
                {name}
            </span>
        </motion.span>
    );
}
