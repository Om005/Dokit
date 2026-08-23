"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { projectActions } from "@/store/project";
import { codelinkActions } from "@/store/codelink";
import { FolderCode, Users, Link2, Github, Cpu, ArrowRight, Activity, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateProjectFromGithubDialog } from "@/components/create-project-from-github-dialog";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export default function DashboardPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { username } = useSelector((state: RootState) => state.auth);
    const { projects, loadingProjects } = useSelector((state: RootState) => state.project);
    const { links, loadingLinks } = useSelector((state: RootState) => state.codelink);

    const [githubDialogOpen, setGithubDialogOpen] = useState(false);
    const hour = new Date().getHours();

    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    useEffect(() => {
        dispatch(projectActions.fetchProjects());
        dispatch(codelinkActions.listCodeLinks());
    }, [dispatch]);

    const myProjectsCount = projects.filter((p) => p.isOwner).length;
    const sharedProjectsCount = projects.filter((p) => !p.isOwner).length;
    const activeCodelinksCount = links.length;

    const shouldReduceMotion = useReducedMotion();
    const customEase = [0.215, 0.61, 0.355, 1] as [number, number, number, number];

    const fadeUpVariants = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: customEase } },
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: customEase } },
    };

    const stats = [
        {
            name: "My Projects",
            value: loadingProjects ? "..." : myProjectsCount,
            icon: FolderCode,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            name: "Shared With Me",
            value: loadingProjects ? "..." : sharedProjectsCount,
            icon: Users,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            name: "Code Links",
            value: loadingLinks ? "..." : activeCodelinksCount,
            icon: Link2,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
        },
    ];

    const features = [
        {
            title: "My Projects",
            description:
                "Access your coding workspace, file manager, terminal, and live collaborative editor.",
            icon: FolderCode,
            href: "/dashboard/projects",
            actionText: "Manage Projects",
            color: "group-hover:text-blue-500",
            border: "hover:border-blue-500/50",
            badge: null,
        },
        {
            title: "Shared with Me",
            description:
                "View and collaboratively edit projects shared with you by other users in real-time.",
            icon: Users,
            href: "/dashboard/projects?shared=true",
            actionText: "View Shared Work",
            color: "group-hover:text-emerald-500",
            border: "hover:border-emerald-500/50",
            badge: null,
        },
        {
            title: "Code Links",
            description:
                "Share single code snippets securely with optional password protection, visibility settings, and expiration time.",
            icon: Link2,
            href: "/dashboard/codelink/generate",
            actionText: "Generate Link",
            color: "group-hover:text-violet-500",
            border: "hover:border-violet-500/50",
            badge: "Secure",
        },
        {
            title: "Import from GitHub",
            description: "Clone any public repository directly into a Dokit project workspace.",
            icon: Github,
            onClick: () => setGithubDialogOpen(true),
            actionText: "Clone Repo",
            color: "group-hover:text-amber-500",
            border: "hover:border-amber-500/50",
            badge: "Git",
        },
        {
            title: "AI Coding Assistant",
            description:
                "Leverage advanced AI pair programming inside your project to review, explain, or write code.",
            icon: Cpu,
            href: "/dashboard/projects",
            actionText: "Open Project to Begin",
            color: "group-hover:text-pink-500",
            border: "hover:border-pink-500/50",
            badge: "AI Powered",
        },
    ];

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="mx-auto max-w-7xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
                {/* Greeting & Header */}
                <motion.div
                    className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                    initial="hidden"
                    animate="visible"
                    variants={fadeUpVariants}
                >
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                            {greeting}, {username || "Developer"}
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Welcome back to your workspace. Start building, sharing, or
                            collaborating.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/u/${username}`}>
                                <Users className="size-4 mr-2" />
                                My Account
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/dashboard/projects">
                                <Plus className="size-4 mr-1.5" />
                                New Project
                            </Link>
                        </Button>
                    </div>
                </motion.div>

                {/* Stats Widgets */}
                <motion.div
                    className="grid gap-4 sm:grid-cols-3 mb-8"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                >
                    {stats.map((stat, i) => (
                        <motion.div key={i} variants={cardVariants} className="h-full">
                            <Card className="border-border/50 bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-md h-full">
                                <CardContent className="p-6 flex items-center justify-between h-full">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {stat.name}
                                        </p>
                                        <p className="text-3xl font-bold tracking-tight">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                                        <stat.icon className={`size-6 ${stat.color}`} />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Main Workspace Navigation Directory */}
                <motion.div
                    className="mb-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={fadeUpVariants}
                >
                    <h2 className="text-xl font-bold tracking-tight mb-2 flex items-center gap-2">
                        <Activity className="size-5 text-primary" />
                        Workspace Directory
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Select a workspace card below to access your projects, snippets, or
                        integration tools.
                    </p>
                </motion.div>

                <motion.div
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                >
                    {features.map((feature, i) => {
                        const CardWrapper = feature.href ? Link : "div";

                        return (
                            <motion.div
                                key={i}
                                variants={cardVariants}
                                whileHover={
                                    shouldReduceMotion
                                        ? {}
                                        : { y: -5, transition: { duration: 0.2, ease: customEase } }
                                }
                                className="h-full"
                            >
                                <Card
                                    className={`group border-border/50 bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-lg ${feature.border} flex flex-col justify-between overflow-hidden cursor-pointer h-full`}
                                    style={{ contentVisibility: "auto" }}
                                >
                                    <CardWrapper
                                        href={feature.href!}
                                        onClick={feature.onClick}
                                        className="flex flex-col h-full justify-between"
                                    >
                                        <div>
                                            <CardHeader className="relative">
                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className={`p-2.5 rounded-lg bg-input/10 group-hover:bg-primary/10 transition-colors duration-300 w-fit mb-3`}
                                                    >
                                                        <feature.icon
                                                            className={`size-5 text-muted-foreground transition-colors duration-300 ${feature.color}`}
                                                        />
                                                    </div>
                                                    {feature.badge && (
                                                        <Badge
                                                            className="absolute top-6 right-6 text-[10px]"
                                                            variant="secondary"
                                                        >
                                                            {feature.badge}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">
                                                    {feature.title}
                                                </CardTitle>
                                                <CardDescription className="text-xs mt-1.5 leading-relaxed">
                                                    {feature.description}
                                                </CardDescription>
                                            </CardHeader>
                                        </div>

                                        <CardFooter className="pt-2 pb-6 border-t border-border/10 bg-input/5 group-hover:bg-input/10 transition-colors duration-300 flex items-center justify-between text-xs text-muted-foreground font-medium">
                                            <span>{feature.actionText}</span>
                                            <ArrowRight className="size-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" />
                                        </CardFooter>
                                    </CardWrapper>
                                </Card>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            {/* GitHub Import Dialog Modal */}
            <CreateProjectFromGithubDialog
                open={githubDialogOpen}
                onOpenChange={setGithubDialogOpen}
            />
        </div>
    );
}
