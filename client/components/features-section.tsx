"use client";

import { Github, Wrench, Users, Terminal, Cloud, Shield } from "lucide-react";

const features = [
    {
        icon: Github,
        title: "Instant GitHub Imports",
        description:
            "Turn any public repository into a fully functioning, interactive development environment in under 10 seconds.",
        color: "from-violet-500/20 to-violet-500/5",
        iconColor: "text-violet-500",
    },
    {
        icon: Wrench,
        title: "Dynamic Tooling",
        description:
            "Install Python, Java, Go, Rust, C++, or terminal utilities like tmux and htop on the fly with a single click.",
        color: "from-amber-500/20 to-amber-500/5",
        iconColor: "text-amber-500",
    },
    {
        icon: Users,
        title: "Multiplayer Coding",
        description:
            "Experience lag-free, real-time collaborative editing powered by Yjs and CodeMirror. Pair program like Google Docs.",
        color: "from-primary/20 to-primary/5",
        iconColor: "text-primary",
    },
    {
        icon: Terminal,
        title: "Integrated Terminal",
        description:
            "Get secure, root-level access to a fully functional Linux terminal directly in your browser. Run servers instantly.",
        color: "from-emerald-500/20 to-emerald-500/5",
        iconColor: "text-emerald-500",
    },
    {
        icon: Cloud,
        title: "Persistent Cloud Storage",
        description:
            "Never lose a single keystroke. Workspaces are automatically synced and backed up to Cloudflare R2 object storage.",
        color: "from-cyan-500/20 to-cyan-500/5",
        iconColor: "text-cyan-500",
    },
    {
        icon: Shield,
        title: "Secure & Isolated",
        description:
            "Every project runs in its own secure, resource-capped Docker container, ensuring your environment is safe and fast.",
        color: "from-rose-500/20 to-rose-500/5",
        iconColor: "text-rose-500",
    },
];

export function FeaturesSection() {
    return (
        <section
            id="features"
            className="relative py-24 px-4 bg-gradient-to-b from-muted/30 to-background"
        >
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-4">
                        Why Dokit?
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                        Everything You Need to
                        <span className="text-primary"> Ship Faster</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        From instant environments to real-time collaboration, Dokit gives you the
                        tools to focus on what matters: writing great code.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-border hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
                        >
                            <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                            >
                                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                            </div>

                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>

                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
