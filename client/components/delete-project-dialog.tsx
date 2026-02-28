"use client";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { projectActions } from "@/store/project";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Payload } from "@/types/types";

interface DeleteProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    projectName: string;
}

export function DeleteProjectDialog({
    open,
    onOpenChange,
    projectId,
    projectName,
}: DeleteProjectDialogProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { deletingProject } = useSelector((state: RootState) => state.project);

    const handleDelete = async () => {
        try {
            const result = await dispatch(projectActions.deleteProject({ projectId }));
            const payload = result.payload as Payload<void>;

            if (payload.success) {
                toast.success("Project deleted successfully");
                onOpenChange(false);
            } else {
                toast.error(payload.message || "Failed to delete project");
            }
        } catch (error) {
            toast.error("An error occurred while deleting the project");
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-foreground">{projectName}</span>? This
                        action cannot be undone. All files and data associated with this project
                        will be permanently deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deletingProject}>Cancel</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleDelete} disabled={deletingProject}>
                        {deletingProject && <Loader2 className="animate-spin" />}
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
