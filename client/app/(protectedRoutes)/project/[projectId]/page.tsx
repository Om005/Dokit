"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import TerminalLoader from "@/components/terminal-loader";
import { use, useCallback, useRef, useState } from "react";
import { Editor } from "@/components/editor";
import { closeTab, editorActions, openTab, setActiveTab, setFileContent } from "@/store/editor";
import { X, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
    params: Promise<{ projectId: string }>;
}

export default function ProjectPage({ params }: Props) {
    const { projectId } = use(params);
    const dispatch = useDispatch<AppDispatch>();

    const currProject = useSelector((state: RootState) => state.editor.currProject);
    const fileTree = useSelector((state: RootState) => state.editor.fileTree);
    const openTabs = useSelector((state: RootState) => state.editor.openTabs);
    const activeTab = useSelector((state: RootState) => state.editor.activeTab);
    const gettingFileContent = useSelector((state: RootState) => state.editor.gettingFileContent);

    const activeFile = activeTab && fileTree ? fileTree[activeTab] : null;

    const wsUrl = `ws://${process.env.NEXT_PUBLIC_NGINX_HOST}/terminal/${projectId}/ws`;

    const [terminalWidth, setTerminalWidth] = useState(400);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(0);

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            isDragging.current = true;
            startX.current = e.clientX;
            startWidth.current = terminalWidth;

            const onMouseMove = (ev: MouseEvent) => {
                if (!isDragging.current) return;
                const delta = startX.current - ev.clientX;
                const newWidth = Math.max(200, Math.min(900, startWidth.current + delta));
                setTerminalWidth(newWidth);
            };

            const onMouseUp = () => {
                isDragging.current = false;
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
            };

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        },
        [terminalWidth]
    );

    const handleCloseTab = (e: React.MouseEvent, filePath: string) => {
        e.stopPropagation();
        dispatch(closeTab(filePath));
    };

    const getFileName = (filePath: string) => filePath.split("/").pop() ?? filePath;

    return (
        <SidebarProvider className="h-screen overflow-hidden">
            <AppSidebar />
            <SidebarInset className="flex flex-col overflow-hidden min-h-0">
                <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <span className="text-sm font-medium truncate">
                        {currProject?.name ?? "Project"}
                    </span>
                </header>

                {openTabs.length > 0 && (
                    <div className="flex shrink-0 items-end overflow-x-auto border-b bg-muted/30 scrollbar-none">
                        {openTabs.map((filePath) => {
                            const isActive = filePath === activeTab;
                            return (
                                <button
                                    key={filePath}
                                    onClick={async () => {
                                        try {
                                            await dispatch(setActiveTab(filePath));
                                        } catch (error) {
                                            toast.error("Failed to switch active tab");
                                            console.error(error);
                                        }
                                    }}
                                    className={cn(
                                        "group flex items-center gap-1.5 px-3 py-2 text-xs border-r border-border shrink-0 max-w-[180px] transition-colors",
                                        isActive
                                            ? "bg-background text-foreground border-t-2 border-t-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <FileIcon className="size-3 shrink-0" />
                                    <span className="truncate">{getFileName(filePath)}</span>
                                    <span
                                        onClick={(e) => handleCloseTab(e, filePath)}
                                        className={cn(
                                            "ml-auto rounded-sm p-0.5 transition-colors shrink-0",
                                            isActive
                                                ? "opacity-60 hover:opacity-100 hover:bg-muted"
                                                : "opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-muted"
                                        )}
                                    >
                                        <X className="size-3" />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="flex flex-1 overflow-hidden min-h-0">
                    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                        {activeTab && activeFile ? (
                            gettingFileContent && activeFile.code === null ? (
                                <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
                                    Loading…
                                </div>
                            ) : (
                                <Editor
                                    className="flex-1 min-h-0"
                                    filename={activeFile.name}
                                    value={activeFile.code ?? ""}
                                    onChange={async (value: string) => {
                                        try {
                                            await dispatch(
                                                setFileContent({
                                                    filePath: activeFile.path,
                                                    content: value,
                                                })
                                            );
                                        } catch (error) {
                                            toast.error("Failed to update file content");
                                            console.error(error);
                                        }
                                    }}
                                />
                            )
                        ) : (
                            <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
                                Select a file to start editing
                            </div>
                        )}
                    </div>

                    <div
                        onMouseDown={onMouseDown}
                        className="w-1 cursor-col-resize bg-border hover:bg-primary/50 transition-colors shrink-0 select-none"
                    />

                    <div
                        style={{ width: terminalWidth }}
                        className="flex flex-col shrink-0 overflow-hidden border-l border-border bg-background"
                    >
                        <TerminalLoader wsUrl={wsUrl} />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
