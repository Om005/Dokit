"use client";

import { Code2, GraduationCap, Rocket, Zap } from "lucide-react";

const audiences = [
    {
        icon: Code2,
        title: "Web Developers",
        description:
            'Spin up Next.js, React, or Node.js servers and test them instantly. No more "works on my machine" issues.',
        features: ["Hot reload preview", "NPM/Yarn support"],
        gradient: "from-primary to-primary/70",
    },
    {
        icon: GraduationCap,
        title: "Students & Teams",
        description:
            "Share a link or invite your friend and instantly pair-program on university assignments or hackathon projects together.",
        features: ["Real-time sync", "Easy sharing"],
        gradient: "from-violet-500 to-violet-500/70",
    },
    {
        icon: Rocket,
        title: "Competitive Programmers",
        description:
            "Practice coding problems with C++, Python, or Java. Run and test your solutions with low latency.",
        features: ["Multi-language", "Custom inputs"],
        gradient: "from-emerald-500 to-emerald-500/70",
    },
];

export function AudienceSection() {
    return (
        <section className="relative py-24 px-4 bg-background overflow-hidden">
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-foreground bg-muted rounded-full mb-4">
                        <Zap className="w-3 h-3" />
                        Built For Everyone
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                        Who Uses Dokit?
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        From hobbyists to professional teams, Dokit adapts to your workflow.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {audiences.map((audience, index) => (
                        <div key={index} className="group relative">
                            <div className="relative h-full p-8 rounded-2xl border border-border/50 bg-gradient-to-b from-card to-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-border hover:shadow-2xl hover:shadow-black/10">
                                <div
                                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${audience.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                />

                                <div
                                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${audience.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                                >
                                    <audience.icon className="w-7 h-7 text-white" />
                                </div>

                                <h3 className="text-xl font-bold text-foreground mb-3">
                                    {audience.title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                    {audience.description}
                                </p>

                                <ul className="space-y-2">
                                    {audience.features.map((feature, featureIndex) => (
                                        <li
                                            key={featureIndex}
                                            className="flex items-center gap-2 text-sm text-muted-foreground"
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${audience.gradient}`}
                                            />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
