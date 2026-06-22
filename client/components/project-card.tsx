"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Lock, Calendar, Archive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectMenu } from "@/components/project-menu";
import { getStackIcon } from "@/components/stack-logos";
import { AppDispatch } from "@/store/store";
import { formatDistanceToNow } from "date-fns";
import { setCurrProject } from "@/store/editor";
import { cn } from "@/lib/utils";

type ProjectStatus = "INITIALIZING" | "RUNNING" | "STOPPED" | "FAILED";

interface ProjectCardProps {
    id: string;
    name: string;
    description?: string;
    stack: string;
    status: ProjectStatus;
    isPasswordProtected: boolean;
    isArchived?: boolean;
    createdAt: string;
}

const STATUS_CONFIG: Record<
    ProjectStatus,
    {
        label: string;
        color: string;
        dotColor: string;
        bgGradient: string;
    }
> = {
    INITIALIZING: {
        label: "Initializing",
        color: "text-amber-600 dark:text-amber-400",
        dotColor: "bg-amber-500 animate-pulse",
        bgGradient: "from-amber-500/10 to-transparent",
    },
    RUNNING: {
        label: "Running",
        color: "text-emerald-600 dark:text-emerald-400",
        dotColor: "bg-emerald-500",
        bgGradient: "from-emerald-500/10 to-transparent",
    },
    STOPPED: {
        label: "Ready to Code",
        color: "text-blue-600 dark:text-blue-400",
        dotColor: "bg-blue-500",
        bgGradient: "from-blue-500/10 to-transparent",
    },
    FAILED: {
        label: "Failed",
        color: "text-rose-600 dark:text-rose-400",
        dotColor: "bg-rose-500 animate-pulse",
        bgGradient: "from-rose-500/10 to-transparent",
    },
};

export function ProjectCard({
    id,
    name,
    description,
    stack,
    status,
    isPasswordProtected,
    isArchived = false,
    createdAt,
}: ProjectCardProps) {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const stackInfo = getStackIcon(stack);

    const formattedDate = new Date(createdAt);
    const timeAgo = formatDistanceToNow(formattedDate, { addSuffix: true });

    const isInitializing = status === "INITIALIZING";
    const isFailed = status === "FAILED";
    const isOpenDisabled = isInitializing || isFailed;

    const statusConfig = STATUS_CONFIG[status];

    const handleOpenProject = () => {
        if (isOpenDisabled) return;

        dispatch(
            setCurrProject({
                id,
                name,
                description,
                stack,
                isPasswordProtected,
                isArchived,
                createdAt,
                lastAccessedAt: createdAt,
            })
        );
        const containerProjectId = id.replaceAll("-", "");
        router.push(`/project/${containerProjectId}`);
    };

    return (
        <Card className="relative overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-lg/20">
            <div
                className={cn(
                    "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b",
                    statusConfig.bgGradient
                )}
            />

            <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4 p-4 sm:p-6 pb-4">
                    <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-balance text-lg font-semibold leading-tight truncate">
                                {name}
                            </h3>
                            {isArchived && (
                                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                    <Archive className="size-3 mr-1" />
                                    Archived
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span
                                className={cn(
                                    "size-1.5 rounded-full flex-shrink-0",
                                    statusConfig.dotColor
                                )}
                            />
                            <span className={cn("text-xs font-medium", statusConfig.color)}>
                                {statusConfig.label}
                            </span>
                        </div>

                        {description && (
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        {isPasswordProtected && (
                            <Lock className="size-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        )}
                        <ProjectMenu projectId={id} />
                    </div>
                </div>

                <div className="flex flex-col gap-3 px-4 sm:px-6 flex-1">
                    {stackInfo && (
                        <div className="inline-flex items-center gap-2 w-fit">
                            <div className={`rounded-md p-1.5 ${stackInfo.color}`}>
                                <stackInfo.icon className="size-4" />
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {stackInfo.name}
                            </Badge>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3 flex-shrink-0" />
                        {timeAgo}
                    </div>
                </div>

                <div className="flex gap-2 p-4 sm:p-6 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handleOpenProject}
                        disabled={isOpenDisabled}
                    >
                        {isInitializing && <Loader2 className="size-4 mr-2 animate-spin" />}
                        {isInitializing ? "Setting up..." : isFailed ? "Failed" : "Open"}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
