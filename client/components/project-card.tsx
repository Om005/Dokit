"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Lock, Calendar, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectMenu } from "@/components/project-menu";
import { getStackIcon } from "@/components/stack-logos";
import { AppDispatch } from "@/store/store";
import { formatDistanceToNow } from "date-fns";
import { setCurrProject } from "@/store/editor";

interface ProjectCardProps {
    id: string;
    name: string;
    description?: string;
    stack: string;
    isPasswordProtected: boolean;
    isArchived?: boolean;
    createdAt: string;
}

export function ProjectCard({
    id,
    name,
    description,
    stack,
    isPasswordProtected,
    isArchived = false,
    createdAt,
}: ProjectCardProps) {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const stackInfo = getStackIcon(stack);

    const formattedDate = new Date(createdAt);
    const timeAgo = formatDistanceToNow(formattedDate, { addSuffix: true });

    const handleOpenProject = () => {
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
        <>
            <Card className="overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-lg/20">
                <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4 p-4 sm:p-6 pb-4">
                        <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-balance text-lg font-semibold leading-tight truncate">
                                    {name}
                                </h3>
                                {isArchived && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs whitespace-nowrap"
                                    >
                                        <Archive className="size-3 mr-1" />
                                        Archived
                                    </Badge>
                                )}
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
                            <ProjectMenu projectId={id} projectName={name} />
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
                        >
                            Open
                        </Button>
                    </div>
                </div>
            </Card>
        </>
    );
}
