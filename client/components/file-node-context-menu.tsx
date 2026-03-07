"use client";

import { FileNode } from "@/types/types";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { File, Folder, Edit2, Trash2 } from "lucide-react";

interface FileNodeContextMenuProps {
    children: React.ReactNode;
    node: FileNode;
    onNewFile?: () => void;
    onNewFolder?: () => void;
    onRename?: () => void;
    onDelete?: () => void;
}

export function FileNodeContextMenu({
    children,
    node,
    onNewFile,
    onNewFolder,
    onRename,
    onDelete,
}: FileNodeContextMenuProps) {
    const isFile = node.type === "file";
    const isFolder = node.type === "directory";

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                {isFolder && (
                    <>
                        <ContextMenuItem onClick={onNewFile}>
                            <File className="mr-2 h-4 w-4" />
                            <span>New File</span>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={onNewFolder}>
                            <Folder className="mr-2 h-4 w-4" />
                            <span>New Folder</span>
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                    </>
                )}
                <ContextMenuItem onClick={onRename}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    <span>Rename</span>
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
