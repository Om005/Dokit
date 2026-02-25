"use client";

import { useState } from "react";
import { Lock, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";
import { getStackIcon } from "@/components/stack-logos";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
    id: string;
    name: string;
    description?: string;
    stack: string;
    isPasswordProtected: boolean;
    createdAt: string;
}

export function ProjectCard({
    id,
    name,
    description,
    stack,
    isPasswordProtected,
    createdAt,
}: ProjectCardProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const stackInfo = getStackIcon(stack);

    const formattedDate = new Date(createdAt);
    const timeAgo = formatDistanceToNow(formattedDate, { addSuffix: true });

    return (
        <>
            <Card className="overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-lg/20">
                <div className="flex h-full flex-col p-4 sm:p-6">
                    <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <h3 className="text-balance text-lg font-semibold leading-tight">
                                {name}
                            </h3>
                            {description && (
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                        {isPasswordProtected && (
                            <Lock className="mt-1 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        )}
                    </div>

                    <div className="mb-4 flex-1">
                        {stackInfo && (
                            <div className="inline-flex items-center gap-2">
                                <div className={`rounded-md p-1.5 ${stackInfo.color}`}>
                                    <stackInfo.icon className="size-4" />
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                    {stackInfo.name}
                                </Badge>
                            </div>
                        )}
                    </div>

                    <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {timeAgo}
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            // variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                                console.log("Open project:", id);
                            }}
                        >
                            Open
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            <DeleteProjectDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                projectId={id}
                projectName={name}
            />
        </>
    );
}
