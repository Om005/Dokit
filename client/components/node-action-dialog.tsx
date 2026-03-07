"use client";

import { useState, useEffect } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface NodeActionDialogProps {
    open: boolean;
    action: "create" | "rename" | "delete" | null;
    nodeType?: "file" | "folder";
    nodeName?: string;
    initialValue?: string;
    isLoading?: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (value?: string) => void;
}

export function NodeActionDialog({
    open,
    action,
    nodeType,
    nodeName,
    initialValue,
    isLoading = false,
    onOpenChange,
    onConfirm,
}: NodeActionDialogProps) {
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        if (open) {
            setInputValue(initialValue ?? "");
        } else {
            setInputValue("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleOpenChange = (newOpen: boolean) => {
        if (!isLoading) {
            onOpenChange(newOpen);
        }
    };

    if (action === "delete") {
        return (
            <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogContent
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !isLoading) onConfirm();
                    }}
                >
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete {nodeType === "folder" ? "Folder" : "File"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold">{nodeName}</span>? This action cannot be
                            undone.
                            {nodeType === "folder" &&
                                " All files and folders inside will also be deleted."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant={"destructive"}
                            onClick={() => onConfirm()}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }

    if (action === "create" || action === "rename") {
        const isCreate = action === "create";
        const title = isCreate
            ? `Create New ${nodeType === "folder" ? "Folder" : "File"}`
            : `Rename ${nodeType === "folder" ? "Folder" : "File"}`;
        const description = isCreate
            ? `Enter the name for your new ${nodeType === "folder" ? "folder" : "file"}`
            : `Enter the new name for ${nodeName}`;

        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder={nodeType === "folder" ? "Folder name" : "File name"}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && inputValue.trim() && !isLoading) {
                                    onConfirm(inputValue);
                                }
                            }}
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (inputValue.trim()) {
                                    onConfirm(inputValue);
                                }
                            }}
                            disabled={isLoading || !inputValue.trim()}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isCreate ? "Create" : "Rename"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return null;
}
