"use client";

import { Calendar, MoreVertical, Lock, Pin, UserPlus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { projectActions } from "@/store/project";
import { toast } from "sonner";
import { Payload } from "@/types/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { getStackIcon } from "@/components/stack-logos";

interface ProfileProjectCardProps {
    id: string;
    name: string;
    description?: string;
    stack: string;
    isPasswordProtected?: boolean;
    createdAt: string;
    pinned?: boolean;
    onView?: (projectId: string) => void;
}

export function ProfileProjectCard({
    id,
    name,
    description,
    stack,
    isPasswordProtected = false,
    createdAt,
    pinned = false,
    onView,
}: ProfileProjectCardProps) {
    const dispatch = useDispatch<AppDispatch>();
    const requestingAccess = useSelector((state: RootState) => state.project.requestingAccess);
    const stackInfo = getStackIcon(stack);

    const formattedDate = new Date(createdAt);
    const timeAgo = formatDistanceToNow(formattedDate, { addSuffix: true });

    const handleRequestAccess = async () => {
        try {
            const result = await dispatch(projectActions.requestProjectAccess({ projectId: id }));
            const payload = result.payload as Payload<void>;
            if (payload?.success) {
                toast.success("Access request sent.");
            } else {
                toast.error(payload?.message ?? "Failed to request access.");
            }
        } catch (error) {
            toast.error("Failed to request access.");
        }
    };

    return (
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-xl/20 border-border/50 bg-gradient-to-br from-card to-card/80 group">
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 p-5 pb-3">
                    <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                                {name}
                            </h3>
                            {pinned && (
                                <Badge
                                    variant="secondary"
                                    className="text-xs whitespace-nowrap bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                >
                                    <Pin className="size-3 mr-1" />
                                    Pinned
                                </Badge>
                            )}
                        </div>
                        {description && (
                            <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        {isPasswordProtected && (
                            <div className="p-1.5 rounded-lg bg-amber-500/10">
                                <Lock className="size-4 text-amber-600 dark:text-amber-400" />
                            </div>
                        )}
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                                >
                                    <MoreVertical className="size-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onClick={handleRequestAccess}
                                    className="cursor-pointer"
                                    disabled={requestingAccess}
                                >
                                    <UserPlus className="mr-2 size-4" />
                                    {requestingAccess ? "Requesting..." : "Request to Join"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Stack and Metadata */}
                <div className="flex flex-col gap-3 px-5 flex-1">
                    {stackInfo && (
                        <div className="inline-flex items-center gap-2 w-fit">
                            <div
                                className={`rounded-lg p-2 ${stackInfo.color} transition-transform group-hover:scale-105`}
                            >
                                <stackInfo.icon className="size-4" />
                            </div>
                            <Badge variant="secondary" className="text-xs bg-muted/50">
                                {stackInfo.name}
                            </Badge>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3.5 flex-shrink-0" />
                        <span>{timeAgo}</span>
                    </div>
                </div>

                {/* Action Button */}
                <div className="p-5 pt-4 mt-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10 rounded-lg border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                        onClick={() => onView?.(id)}
                    >
                        View Project
                    </Button>
                </div>
            </div>
        </Card>
    );
}
