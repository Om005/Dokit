"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import TerminalLoader from "@/components/terminal-loader";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "@/components/editor";
import {
    addNode,
    closeTab,
    deleteNode,
    editorActions,
    renameNode,
    setActiveTab,
    setCurrProject,
    setOpenTabs,
} from "@/store/editor";
import { projectActions, setLastProject, setPendingPassword } from "@/store/project";
import { Eye, EyeOff, Loader2, X, FileIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Payload, TreeNode } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import useFileTreeSocket from "@/hooks/use-filetree-socket";

interface Props {
    params: Promise<{ projectId: string }>;
}

export default function ProjectPage({ params }: Props) {
    const { projectId } = use(params);
    const dispatch = useDispatch<AppDispatch>();
    const { lastProject } = useSelector((state: RootState) => state.project);

    const currProject = useSelector((state: RootState) => state.editor.currProject);
    const fileTree = useSelector((state: RootState) => state.editor.fileTree);
    const openTabs = useSelector((state: RootState) => state.editor.openTabs);
    const activeTab = useSelector((state: RootState) => state.editor.activeTab);
    const gettingFileContent = useSelector((state: RootState) => state.editor.gettingFileContent);
    const pendingPassword = useSelector((state: RootState) => state.project.pendingPassword);

    const apiProjectId =
        currProject?.id ??
        `${projectId.slice(0, 8)}-${projectId.slice(8, 12)}-${projectId.slice(12, 16)}-${projectId.slice(16, 20)}-${projectId.slice(20)}`;

    const [isBooting, setIsBooting] = useState(true);
    const [bootError, setBootError] = useState<string | null>(null);
    const hasBoot = useRef(false);

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [passwordFormError, setPasswordFormError] = useState<string | null>(null);

    const [terminalWidth, setTerminalWidth] = useState(400);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(0);

    const onNodeCreation = useCallback(
        (parentPath: string, newNode: TreeNode) => {
            try {
                dispatch(addNode({ parentPath, newNode }));
            } catch (error) {
                console.error("Error creating node:", error);
            }
        },
        [dispatch]
    );
    const onNodeDeletion = useCallback(
        (path: string, isDir: boolean) => {
            try {
                dispatch(deleteNode({ path, isDir }));
            } catch (error) {
                console.error("Error deleting node:", error);
            }
        },
        [dispatch]
    );
    const onRenameNode = useCallback(
        (fromPath: string, toPath: string, isDir: boolean) => {
            try {
                // console.log(`rere ${fromPath} to ${toPath}, ${isDir}`);
                dispatch(renameNode({ fromPath, toPath, isDir }));
            } catch (error) {
                console.error("Error renaming node:", error);
            }
        },
        [dispatch]
    );
    useFileTreeSocket(apiProjectId, onNodeCreation, onNodeDeletion, onRenameNode);

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

    const runBoot = async () => {
        try {
            const result = await dispatch(
                projectActions.startProject({
                    projectId: apiProjectId,
                    password: pendingPassword ?? undefined,
                })
            );

            if (pendingPassword) {
                dispatch(setPendingPassword(null));
            }

            const payload = result.payload as Payload<{ project: typeof currProject }>;
            if (payload?.success) {
                if (payload.data?.project) {
                    dispatch(setCurrProject(payload.data.project));
                }
                if (lastProject !== apiProjectId) {
                    await dispatch(
                        editorActions.getRootContent({ projectId: apiProjectId, folderPath: "/" })
                    );
                    dispatch(setOpenTabs([]));
                    dispatch(setActiveTab(null));
                }
                await dispatch(setLastProject(apiProjectId));
                setIsBooting(false);
            } else {
                setBootError(payload?.message ?? "Failed to start project.");
                setIsBooting(false);
            }
        } catch (err) {
            console.error("Boot error:", err);
            setBootError("Failed to boot project. Please try again.");
            setIsBooting(false);
        }
    };

    useEffect(() => {
        if (hasBoot.current) return;
        hasBoot.current = true;

        if (currProject?.isPasswordProtected && !pendingPassword) {
            setIsBooting(false);
            setShowPasswordForm(true);
            return;
        }

        runBoot();
    }, []);

    const handlePasswordFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordInput.trim()) return;
        setShowPasswordForm(false);
        setIsBooting(true);
        setIsSubmittingPassword(true);
        setPasswordFormError(null);
        try {
            const result = await dispatch(
                projectActions.startProject({
                    projectId: apiProjectId,
                    password: passwordInput,
                })
            );
            const payload = result.payload as Payload<{ project: typeof currProject }>;
            if (payload?.success) {
                if (payload.data?.project) {
                    dispatch(setCurrProject(payload.data.project));
                }
                await dispatch(
                    editorActions.getRootContent({ projectId: apiProjectId, folderPath: "/" })
                );
                dispatch(setOpenTabs([]));
                dispatch(setActiveTab(null));
                setShowPasswordForm(false);
            } else {
                setIsBooting(false);
                setBootError(payload?.message ?? "Failed to start project.");
                setPasswordFormError(payload?.message ?? "Incorrect password.");
            }
        } catch (err) {
            console.error("Password submit error:", err);
            setPasswordFormError("An error occurred. Please try again.");
        } finally {
            setIsSubmittingPassword(false);
            setIsBooting(false);
        }
    };

    const activeFile = activeTab && fileTree ? fileTree[activeTab] : null;

    const wsUrl = `ws://${process.env.NEXT_PUBLIC_NGINX_HOST}/terminal/${projectId}/ws`;

    if (showPasswordForm) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background px-4">
                <div className="w-full max-w-sm space-y-6">
                    <div className="space-y-2 text-center">
                        <div className="flex justify-center">
                            <Lock className="size-8 text-amber-500" />
                        </div>
                        <h2 className="text-lg font-semibold">Password Protected</h2>
                        <p className="text-sm text-muted-foreground">
                            &ldquo;{currProject?.name ?? "This project"}&rdquo; requires a password
                            to open.
                        </p>
                    </div>

                    <form onSubmit={handlePasswordFormSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="project-password"
                                    type={showPasswordInput ? "text" : "password"}
                                    placeholder="Enter project password"
                                    maxLength={50}
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    disabled={isSubmittingPassword}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordInput(!showPasswordInput)}
                                    className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPasswordInput ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                            {passwordFormError && (
                                <p className="text-xs text-destructive">{passwordFormError}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmittingPassword || !passwordInput.trim()}
                        >
                            {isSubmittingPassword && <Loader2 className="size-4 animate-spin" />}
                            Unlock Project
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    if (isBooting) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background gap-8 px-4">
                <div className="w-full max-w-sm space-y-3">
                    <div className="h-3 bg-muted rounded-full animate-pulse" />
                    <div className="h-3 bg-muted rounded-full animate-pulse w-5/6" />
                    <div className="h-3 bg-muted rounded-full animate-pulse w-4/6" />
                    <div className="mt-6 h-3 bg-muted rounded-full animate-pulse w-3/6" />
                    <div className="h-3 bg-muted rounded-full animate-pulse w-5/6" />
                    <div className="h-3 bg-muted rounded-full animate-pulse w-2/6" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-sm font-semibold tracking-wide">Booting your project</p>
                    <p className="text-xs text-muted-foreground">
                        Hold tight, this might take a few seconds&hellip;
                    </p>
                </div>
                <div className="flex gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                </div>
            </div>
        );
    }

    if (bootError) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background gap-4 px-4">
                <p className="text-sm font-medium text-destructive">{bootError}</p>
                <button
                    className="text-xs text-muted-foreground underline"
                    onClick={() => {
                        hasBoot.current = false;
                        setBootError(null);
                        if (bootError === "Incorrect password.") {
                            setShowPasswordForm(true);
                            setIsBooting(false);
                        } else {
                            setIsBooting(true);
                            runBoot();
                        }
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

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
                            gettingFileContent ? (
                                <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
                                    Loading…
                                </div>
                            ) : (
                                <Editor
                                    key={activeFile.path}
                                    className="flex-1 min-h-0"
                                    filePath={activeFile.path}
                                    projectId={projectId}
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
