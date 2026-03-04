"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Lock, Calendar, Archive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectMenu } from "@/components/project-menu";
import { ProjectPasswordDialog } from "@/components/project-password-dialog";
import { getStackIcon, getStackName } from "@/components/stack-logos";
import { projectActions } from "@/store/project";
import { AppDispatch, RootState } from "@/store/store";
import { formatDistanceToNow } from "date-fns";
import { FileNode, Payload, Project } from "@/types/types";
import {
    editorActions,
    setActiveTab,
    setCurrProject,
    setFileTree,
    setOpenTabs,
} from "@/store/editor";

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
    const { startingProject } = useSelector((state: RootState) => state.project);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const stackInfo = getStackIcon(stack);

    const formattedDate = new Date(createdAt);
    const timeAgo = formatDistanceToNow(formattedDate, { addSuffix: true });

    const handleOpenProject = async (password?: string) => {
        try {
            const result = await dispatch(
                projectActions.startProject({
                    name,
                    password,
                })
            );
            const payload = result.payload as Payload<{
                project: Project;
                FileTree: Record<string, FileNode>;
            }>;

            if (payload?.success) {
                const projectId = payload?.data?.project?.id;
                if (projectId) {
                    toast.success("Project started successfully!");
                    await dispatch(setCurrProject(payload.data!.project));
                    await dispatch(editorActions.getRootContent({ projectId, folderPath: "/" }));
                    await dispatch(setOpenTabs([]));
                    await dispatch(setActiveTab(null));
                    const containerProjectId = projectId.replaceAll("-", "");
                    if (projectId) {
                        router.push(`/project/${containerProjectId}`);
                    }
                } else {
                    toast.error("Project started but failed to retrieve project ID");
                }
            } else {
                toast.error(payload?.message || "Failed to start project");
            }
        } catch (error) {
            toast.error("An error occurred while starting the project");
            console.error(error);
        }
    };

    const handleClickOpen = () => {
        if (isPasswordProtected) {
            setPasswordDialogOpen(true);
        } else {
            handleOpenProject();
        }
    };

    const handlePasswordSubmit = async (password: string) => {
        await handleOpenProject(password);
    };

    return (
        <>
            <Card className="overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-lg/20">
                <div className="flex h-full flex-col">
                    {/* Header with Menu */}
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

                    {/* Stack and Metadata */}
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
                            onClick={handleClickOpen}
                            disabled={startingProject}
                        >
                            Open
                        </Button>
                    </div>
                </div>
            </Card>

            <ProjectPasswordDialog
                open={passwordDialogOpen}
                projectName={name}
                onOpenChange={setPasswordDialogOpen}
                onSubmit={handlePasswordSubmit}
                isLoading={startingProject}
            />
        </>
    );
}
