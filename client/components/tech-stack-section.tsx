"use client";

import { Box, Code2, Database, Cloud, Server, FileCode2 } from "lucide-react";

const techStack = [
    { name: "Docker", icon: Box },
    { name: "Next.js", icon: Code2 },
    { name: "Node.js", icon: Server },
    { name: "PostgreSQL", icon: Database },
    { name: "Cloudflare", icon: Cloud },
    { name: "CodeMirror", icon: FileCode2 },
];

export function TechStackSection() {
    return (
        <section className="py-16 px-4 bg-muted/30 border-y border-border/50">
            <div className="max-w-4xl mx-auto">
                <p className="text-center text-sm text-muted-foreground mb-8">
                    Powered by industry-leading technologies
                </p>
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                    {techStack.map((tech, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 group"
                        >
                            <tech.icon className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span className="text-sm font-medium">{tech.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
