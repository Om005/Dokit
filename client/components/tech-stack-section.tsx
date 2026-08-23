"use client";

import { Box, Code2, Database, Cloud, Server, FileCode2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const techStack = [
    { name: "Docker", icon: Box },
    { name: "Next.js", icon: Code2 },
    { name: "Node.js", icon: Server },
    { name: "PostgreSQL", icon: Database },
    { name: "Cloudflare", icon: Cloud },
    { name: "CodeMirror", icon: FileCode2 },
];

export function TechStackSection() {
    const shouldReduceMotion = useReducedMotion();
    const ease = [0.215, 0.61, 0.355, 1] as [number, number, number, number];

    return (
        <section className="py-16 px-4 bg-muted/30 border-y border-border/50">
            <div className="max-w-4xl mx-auto">
                <motion.p
                    className="text-center text-sm text-muted-foreground mb-8"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, ease }}
                >
                    Powered by industry-leading technologies
                </motion.p>
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                    {techStack.map((tech, index) => (
                        <motion.div
                            key={index}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 group"
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.8, delay: index * 0.1, ease }}
                        >
                            <tech.icon className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span className="text-sm font-medium">{tech.name}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
