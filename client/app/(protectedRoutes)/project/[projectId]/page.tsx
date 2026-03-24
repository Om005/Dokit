"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import TerminalLoader from "@/components/terminal-loader";
import { Fragment, use, useCallback, useEffect, useRef, useState } from "react";
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
    toggleLineWrapping,
} from "@/store/editor";
import { projectActions, setLastProject, setPendingPassword } from "@/store/project";
import {
    Eye,
    EyeOff,
    Loader2,
    X,
    FileIcon,
    Lock,
    Play,
    ChevronRight,
    PanelBottom,
    PanelRight,
    WrapText,
    AlignLeft,
    Monitor,
    MonitorOff,
    RefreshCw,
    GitPullRequestCreate,
    GitPullRequestDraft,
    UserCheck,
    UserCog,
    Inbox,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Payload, TreeNode } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import useFileTreeSocket from "@/hooks/use-filetree-socket";
import { useRouter } from "next/navigation";
import { toggleTerminalPosition } from "@/store/editor";
import { PreviewPane } from "@/components/preview-panel";
import defaultPorts from "@/utils/defaultPorts";

interface Props {
    params: Promise<{ projectId: string }>;
}

export default function ProjectPage({ params }: Props) {
    const { projectId } = use(params);
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { lastProject, closingProject } = useSelector((state: RootState) => state.project);
    const {
        pendingRequests,
        gettingPendingRequests,
        changingMemberAccess,
        removingMember,
        invitingMember,
    } = useSelector((state: RootState) => state.project);

    const currProject = useSelector((state: RootState) => state.editor.currProject);
    const fileTree = useSelector((state: RootState) => state.editor.fileTree);
    const openTabs = useSelector((state: RootState) => state.editor.openTabs);
    const activeTab = useSelector((state: RootState) => state.editor.activeTab);
    const gettingFileContent = useSelector((state: RootState) => state.editor.gettingFileContent);
    const pendingPassword = useSelector((state: RootState) => state.project.pendingPassword);
    const terminalPosition = useSelector((state: RootState) => state.editor.terminalPosition);
    const lineWrapping = useSelector((state: RootState) => state.editor.lineWrapping);
    const apiProjectId = `${projectId.slice(0, 8)}-${projectId.slice(8, 12)}-${projectId.slice(12, 16)}-${projectId.slice(16, 20)}-${projectId.slice(20)}`;

    const [isBooting, setIsBooting] = useState(true);
    const [bootError, setBootError] = useState<string | null>(null);
    const hasBoot = useRef(false);

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [passwordFormError, setPasswordFormError] = useState<string | null>(null);

    // const [terminalPosition, setTerminalPosition] = useState<"bottom" | "right">("bottom");
    const [terminalHeight, setTerminalHeight] = useState(250);
    const [terminalWidth, setTerminalWidth] = useState(380);
    const [showPreview, setShowPreview] = useState(false);
    const [previewWidth, setPreviewWidth] = useState(400);
    const [previewHeight, setPreviewHeight] = useState(250);
    const [showAccessPanel, setShowAccessPanel] = useState(false);
    const [pendingRequestQuery, setPendingRequestQuery] = useState("");
    const [accessPanelTab, setAccessPanelTab] = useState<"members" | "requests" | "invite">(
        "members"
    );
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteAccessLevel, setInviteAccessLevel] = useState<"READ" | "WRITE">("READ");
    const hasFetchedPendingRequests = useRef(false);
    const isDragging = useRef(false);
    const startPos = useRef(0);
    const startSize = useRef(0);

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

    // const toggleTerminalPosition = useCallback(() => {
    //     dispatch(toggleTerminalPosition());
    // }, [dispatch]);

    const onBottomDragStart = useCallback(
        (e: React.MouseEvent) => {
            isDragging.current = true;
            startPos.current = e.clientY;
            startSize.current = terminalHeight;

            const onMouseMove = (ev: MouseEvent) => {
                if (!isDragging.current) return;
                const delta = startPos.current - ev.clientY;
                const newHeight = Math.max(0, Math.min(600, startSize.current + delta));
                setTerminalHeight(newHeight);
            };
            const onMouseUp = () => {
                isDragging.current = false;
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
            };
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        },
        [terminalHeight]
    );

    const onRightDragStart = useCallback(
        (e: React.MouseEvent) => {
            isDragging.current = true;
            startPos.current = e.clientX;
            startSize.current = terminalWidth;

            const onMouseMove = (ev: MouseEvent) => {
                if (!isDragging.current) return;
                const delta = startPos.current - ev.clientX;
                const newWidth = Math.max(220, Math.min(900, startSize.current + delta));
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

    const onPreviewHorizDragStart = useCallback(
        (e: React.MouseEvent) => {
            isDragging.current = true;
            startPos.current = e.clientX;
            startSize.current = previewWidth;

            const onMouseMove = (ev: MouseEvent) => {
                if (!isDragging.current) return;
                const delta = startPos.current - ev.clientX;
                const newWidth = Math.max(200, Math.min(800, startSize.current + delta));
                setPreviewWidth(newWidth);
            };
            const onMouseUp = () => {
                isDragging.current = false;
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
            };
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        },
        [previewWidth]
    );

    const onPreviewVertDragStart = useCallback(
        (e: React.MouseEvent) => {
            isDragging.current = true;
            startPos.current = e.clientY;
            startSize.current = previewHeight;

            const onMouseMove = (ev: MouseEvent) => {
                if (!isDragging.current) return;
                const delta = ev.clientY - startPos.current;
                const newHeight = Math.max(100, Math.min(600, startSize.current + delta));
                setPreviewHeight(newHeight);
            };
            const onMouseUp = () => {
                isDragging.current = false;
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
            };
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        },
        [previewHeight]
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
                if (payload.message === "Password is required to start this project.") {
                    setShowPasswordForm(true);
                } else {
                    setBootError(payload?.message ?? "Failed to start project.");
                    setIsBooting(false);
                }
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

        // if (currProject?.isPasswordProtected && !pendingPassword) {
        //     setIsBooting(false);
        //     setShowPasswordForm(true);
        //     return;
        // }

        runBoot();
    }, []);

    const isProjectPublic = currProject?.visibility === "PUBLIC";

    useEffect(() => {
        if (!isProjectPublic && accessPanelTab === "requests") {
            setAccessPanelTab("members");
        }
    }, [accessPanelTab, isProjectPublic]);

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
                if (lastProject !== apiProjectId) {
                    await dispatch(
                        editorActions.getRootContent({ projectId: apiProjectId, folderPath: "/" })
                    );
                    dispatch(setOpenTabs([]));
                    dispatch(setActiveTab(null));
                }
                dispatch(setLastProject(apiProjectId));
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

    const isPreviewSupported = !!(
        currProject && Object.keys(defaultPorts).includes(currProject.stack.toLowerCase())
    );

    const activeFile = activeTab && fileTree ? fileTree[activeTab] : null;
    const isOwner = currProject?.currentUserAccess === "OWNER" || currProject?.isOwner === true;

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

    const handleCloseProject = async () => {
        try {
            const response = await dispatch(
                projectActions.closeProject({ projectId: currProject!.id })
            );
            const payload = response.payload as Payload<void>;
            if (payload?.success) {
                toast.success("Project closed successfully.");
            } else {
                toast.error(payload?.message ?? "Failed to close project.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred while closing the project.");
            console.error(error);
        } finally {
            router.push("/dashboard/projects");
        }
    };

    const getFileName = (filePath: string) => filePath.split("/").pop() ?? filePath;

    const handleToggleAccessPanel = () => {
        const nextValue = !showAccessPanel;
        setShowAccessPanel(nextValue);
        if (nextValue) {
            setAccessPanelTab("members");
        }

        if (nextValue && isProjectPublic && !hasFetchedPendingRequests.current) {
            hasFetchedPendingRequests.current = true;
            dispatch(projectActions.getPendingAccessRequests({ projectId: apiProjectId }));
        }
    };

    const handleRefreshPendingRequests = () => {
        dispatch(projectActions.getPendingAccessRequests({ projectId: apiProjectId }));
    };

    const handleReviewRequest = (requestId: string, status: "APPROVED" | "REJECTED") => {
        dispatch(projectActions.reviewRequest({ requestId, status }));
    };

    const handleChangeMemberAccess = (userId: string, accessLevel: "READ" | "WRITE") => {
        dispatch(
            projectActions.changeMemberAccess({
                projectId: apiProjectId,
                userId,
                newAccessLevel: accessLevel,
            })
        );
    };

    const handleRemoveMember = (userId: string) => {
        dispatch(projectActions.removeMember({ projectId: apiProjectId, userId }));
    };

    const filteredPendingRequests = (pendingRequests ?? []).filter((request) =>
        request.username.toLowerCase().includes(pendingRequestQuery.trim().toLowerCase())
    );

    const handleInviteMember = async () => {
        if (!inviteEmail.trim()) return;
        const response = await dispatch(
            projectActions.inviteMemeber({
                projectId: apiProjectId,
                email: inviteEmail.trim(),
                accessLevel: inviteAccessLevel,
            })
        );
        const payload = response.payload as Payload<{ user?: { userId: string } }>;
        if (payload?.success) {
            setInviteEmail("");
        } else {
            toast.error(payload?.message ?? "Failed to invite member.");
        }
    };

    return (
        <SidebarProvider className="h-screen overflow-hidden">
            <AppSidebar />

            <SidebarInset className="flex flex-col overflow-hidden min-h-0 relative">
                <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1 shrink-0" />
                    <Separator
                        orientation="vertical"
                        className="data-[orientation=vertical]:h-4 shrink-0"
                    />
                    <span className="text-sm font-medium truncate shrink-0">
                        {currProject?.name ?? "Project"}
                    </span>
                    <div className="flex-1 flex justify-center">
                        <Button size="sm" variant="secondary" className="gap-1.5">
                            <Play className="size-3.5" />
                            Run
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        {isOwner && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5"
                                onClick={handleToggleAccessPanel}
                                title="Project access"
                            >
                                <UserCog className="w-4 h-4" />
                            </Button>
                        )}
                        {isPreviewSupported && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5"
                                onClick={() => setShowPreview((v) => !v)}
                                title={showPreview ? "Hide preview" : "Show preview"}
                            >
                                {showPreview ? (
                                    <MonitorOff className="size-3.5" />
                                ) : (
                                    <Monitor className="size-3.5" />
                                )}
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5"
                            onClick={() => dispatch(toggleLineWrapping())}
                            title={lineWrapping ? "Disable line wrapping" : "Enable line wrapping"}
                        >
                            {lineWrapping ? (
                                <AlignLeft className="size-3.5" />
                            ) : (
                                <WrapText className="size-3.5" />
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5"
                            onClick={() => dispatch(toggleTerminalPosition())}
                            title={
                                terminalPosition === "bottom"
                                    ? "Move terminal to right"
                                    : "Move terminal to bottom"
                            }
                        >
                            {terminalPosition === "bottom" ? (
                                <PanelRight className="size-3.5" />
                            ) : (
                                <PanelBottom className="size-3.5" />
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleCloseProject}
                            disabled={closingProject}
                        >
                            {closingProject ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Closing...
                                </>
                            ) : (
                                "Close Project"
                            )}
                        </Button>
                    </div>
                </header>

                {isOwner && showAccessPanel && (
                    // <div className="absolute right-4 top-14 z-50 w-[380px] max-w-[92vw] rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm shadow-xl shadow-black/10 dark:shadow-black/30">
                    //     <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                    //         <span className="text-sm font-semibold text-foreground">
                    //             Project Access
                    //         </span>
                    //         <Button
                    //             size="sm"
                    //             variant="ghost"
                    //             className="text-muted-foreground hover:text-foreground"
                    //             onClick={() => setShowAccessPanel(false)}
                    //         >
                    //             Close
                    //         </Button>
                    //     </div>
                    //     <Tabs
                    //         value={accessPanelTab}
                    //         onValueChange={(value) =>
                    //             setAccessPanelTab(value as "members" | "requests" | "invite")
                    //         }
                    //         className="flex flex-col"
                    //     >
                    //         <TabsList variant="line" className="w-full justify-start px-4 pt-2">
                    //             <TabsTrigger value="members">Members</TabsTrigger>
                    //             {isProjectPublic && (
                    //                 <TabsTrigger value="requests">Requests</TabsTrigger>
                    //             )}
                    //             <TabsTrigger value="invite">Invite User</TabsTrigger>
                    //         </TabsList>
                    //         <TabsContent value="members" className="px-4 py-3">
                    //             <div className="space-y-2 max-h-80 overflow-y-auto">
                    //                 {(currProject?.members ?? []).length === 0 ? (
                    //                     <div className="flex flex-col items-center justify-center py-8 text-center">
                    //                         <p className="text-sm text-muted-foreground">
                    //                             No members yet
                    //                         </p>
                    //                     </div>
                    //                 ) : (
                    //                     (currProject?.members ?? []).map((member) => {
                    //                         const isMemberOwner =
                    //                             member.userId === currProject?.ownerId ||
                    //                             member.accessLevel === "OWNER";
                    //                         return (
                    //                             <div
                    //                                 key={member.userId}
                    //                                 className="rounded-lg border border-border/50 bg-muted/30 p-3 transition-all duration-200 hover:bg-muted/50 hover:border-border"
                    //                             >
                    //                                 <div className="flex items-center justify-between gap-2">
                    //                                     <div className="min-w-0">
                    //                                         <p className="text-sm font-medium text-foreground truncate">
                    //                                             {member.username}
                    //                                         </p>
                    //                                         <Badge
                    //                                             variant={
                    //                                                 member.accessLevel ===
                    //                                                 "OWNER"
                    //                                                     ? "default"
                    //                                                     : "secondary"
                    //                                             }
                    //                                             className="mt-1"
                    //                                         >
                    //                                             {member.accessLevel}
                    //                                         </Badge>
                    //                                     </div>
                    //                                     <div className="flex items-center gap-2">
                    //                                         {isMemberOwner ? (
                    //                                             <span className="text-xs text-muted-foreground px-2">
                    //                                                 Owner
                    //                                             </span>
                    //                                         ) : (
                    //                                             <Select
                    //                                                 value={member.accessLevel}
                    //                                                 onValueChange={(value) => {
                    //                                                     if (
                    //                                                         value ===
                    //                                                         member.accessLevel
                    //                                                     ) {
                    //                                                         return;
                    //                                                     }
                    //                                                     if (
                    //                                                         value === "READ" ||
                    //                                                         value === "WRITE"
                    //                                                     ) {
                    //                                                         handleChangeMemberAccess(
                    //                                                             member.userId,
                    //                                                             value
                    //                                                         );
                    //                                                     }
                    //                                                 }}
                    //                                                 disabled={changingMemberAccess}
                    //                                             >
                    //                                                 <SelectTrigger
                    //                                                     size="sm"
                    //                                                     className="min-w-[110px]"
                    //                                                 >
                    //                                                     <SelectValue placeholder="Access" />
                    //                                                 </SelectTrigger>
                    //                                                 <SelectContent align="end">
                    //                                                     <SelectItem value="READ">
                    //                                                         Read
                    //                                                     </SelectItem>
                    //                                                     <SelectItem value="WRITE">
                    //                                                         Write
                    //                                                     </SelectItem>
                    //                                                 </SelectContent>
                    //                                             </Select>
                    //                                         )}
                    //                                         <Button
                    //                                             size="sm"
                    //                                             variant="ghost"
                    //                                             className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    //                                             onClick={() =>
                    //                                                 handleRemoveMember(member.userId)
                    //                                             }
                    //                                             disabled={
                    //                                                 isMemberOwner || removingMember
                    //                                             }
                    //                                         >
                    //                                             Remove
                    //                                         </Button>
                    //                                     </div>
                    //                                 </div>
                    //                             </div>
                    //                         );
                    //                     })
                    //                 )}
                    //             </div>
                    //         </TabsContent>
                    //         {isProjectPublic && (
                    //             <TabsContent value="requests" className="px-4 py-3">
                    //             <div className="flex items-center gap-2">
                    //                 <Input
                    //                     value={pendingRequestQuery}
                    //                     onChange={(e) => setPendingRequestQuery(e.target.value)}
                    //                     placeholder="Search by username..."
                    //                     className="h-9 bg-muted/50 border-border/50 focus-visible:ring-primary/30 flex-1"
                    //                 />
                    //                 <button
                    //                     type="button"
                    //                     onClick={handleRefreshPendingRequests}
                    //                     className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
                    //                     title="Refresh"
                    //                 >
                    //                     <RefreshCw className="size-4" />
                    //                 </button>
                    //             </div>
                    //             <div className="max-h-72 overflow-y-auto pt-3 space-y-2">
                    //                 {gettingPendingRequests ? (
                    //                     <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    //                         <Loader2 className="size-4 animate-spin" />
                    //                         <span>Loading requests...</span>
                    //                     </div>
                    //                 ) : filteredPendingRequests.length > 0 ? (
                    //                     <div className="space-y-2">
                    //                         {filteredPendingRequests.map((request) => (
                    //                             <div
                    //                                 key={request.id}
                    //                                 className="rounded-lg border border-border/50 bg-muted/30 p-3 transition-all duration-200 hover:bg-muted/50 hover:border-border"
                    //                             >
                    //                                 <p className="text-sm font-medium text-foreground">
                    //                                     {request.username}
                    //                                 </p>
                    //                                 <div className="mt-3 flex items-center gap-2">
                    //                                     <Button
                    //                                         size="sm"
                    //                                         className="h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                    //                                         onClick={() =>
                    //                                             handleReviewRequest(
                    //                                                 request.id,
                    //                                                 "APPROVED"
                    //                                             )
                    //                                         }
                    //                                     >
                    //                                         Accept
                    //                                     </Button>
                    //                                     <Button
                    //                                         size="sm"
                    //                                         variant="ghost"
                    //                                         className="h-8 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    //                                         onClick={() =>
                    //                                             handleReviewRequest(
                    //                                                 request.id,
                    //                                                 "REJECTED"
                    //                                             )
                    //                                         }
                    //                                     >
                    //                                         Reject
                    //                                     </Button>
                    //                                 </div>
                    //                             </div>
                    //                         ))}
                    //                     </div>
                    //                 ) : (
                    //                     <div className="flex flex-col items-center justify-center py-8 text-center">
                    //                         <p className="text-sm text-muted-foreground">
                    //                             No pending requests
                    //                         </p>
                    //                     </div>
                    //                 )}
                    //             </div>
                    //         </TabsContent>
                    //         )}
                    //         <TabsContent value="invite" className="px-4 py-3">
                    //             <div className="space-y-3">
                    //                 <div className="space-y-2">
                    //                     <Label htmlFor="invite-email">Email</Label>
                    //                     <Input
                    //                         id="invite-email"
                    //                         value={inviteEmail}
                    //                         onChange={(e) => setInviteEmail(e.target.value)}
                    //                         placeholder="member@example.com"
                    //                         className="h-9 bg-muted/50 border-border/50 focus-visible:ring-primary/30"
                    //                     />
                    //                 </div>
                    //                 <div className="space-y-2">
                    //                     <Label>Access Level</Label>
                    //                     <Select
                    //                         value={inviteAccessLevel}
                    //                         onValueChange={(value) => {
                    //                             if (value === "READ" || value === "WRITE") {
                    //                                 setInviteAccessLevel(value);
                    //                             }
                    //                         }}
                    //                     >
                    //                         <SelectTrigger className="w-full">
                    //                             <SelectValue placeholder="Select access" />
                    //                         </SelectTrigger>
                    //                         <SelectContent>
                    //                             <SelectItem value="READ">Read</SelectItem>
                    //                             <SelectItem value="WRITE">Write</SelectItem>
                    //                         </SelectContent>
                    //                     </Select>
                    //                 </div>
                    //                 <Button
                    //                     className="w-full"
                    //                     onClick={handleInviteMember}
                    //                     disabled={invitingMember || !inviteEmail.trim()}
                    //                 >
                    //                     {invitingMember && (
                    //                         <Loader2 className="size-4 animate-spin" />
                    //                     )}
                    //                     Send Invite
                    //                 </Button>
                    //             </div>
                    //         </TabsContent>
                    //     </Tabs>
                    // </div>
                    <div className="absolute right-4 top-14 z-50 w-[400px] max-w-[92vw] rounded-2xl border border-border/40 bg-gradient-to-b from-background to-background/95 backdrop-blur-md shadow-2xl shadow-black/15 dark:shadow-black/40">
                        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-sm font-semibold text-foreground">
                                    Project Access
                                </span>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg"
                                onClick={() => setShowAccessPanel(false)}
                            >
                                Close
                            </Button>
                        </div>
                        <Tabs
                            value={accessPanelTab}
                            onValueChange={(value) =>
                                setAccessPanelTab(value as "members" | "requests" | "invite")
                            }
                            className="flex flex-col"
                        >
                            <TabsList
                                variant="line"
                                className="w-full justify-start px-5 pt-3 bg-muted/20"
                            >
                                <TabsTrigger
                                    value="members"
                                    className="data-[state=active]:text-primary"
                                >
                                    Members
                                </TabsTrigger>
                                {isProjectPublic && (
                                    <TabsTrigger
                                        value="requests"
                                        className="data-[state=active]:text-primary"
                                    >
                                        Requests
                                    </TabsTrigger>
                                )}
                                <TabsTrigger
                                    value="invite"
                                    className="data-[state=active]:text-primary"
                                >
                                    Invite User
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="members" className="px-5 py-4">
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {(currProject?.members ?? []).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 text-center">
                                            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                                <Users className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                No members yet
                                            </p>
                                        </div>
                                    ) : (
                                        (currProject?.members ?? []).map((member) => {
                                            const isMemberOwner =
                                                member.userId === currProject?.ownerId ||
                                                member.accessLevel === "OWNER";
                                            return (
                                                <div
                                                    key={member.userId}
                                                    className="rounded-xl border border-border/40 bg-gradient-to-r from-muted/40 to-muted/20 p-4 transition-all duration-200 hover:from-muted/60 hover:to-muted/40 hover:border-border/60 hover:shadow-sm"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0 flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                                                                <span className="text-sm font-semibold text-primary">
                                                                    {member.username
                                                                        ?.charAt(0)
                                                                        .toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-foreground truncate">
                                                                    {member.username}
                                                                </p>
                                                                <Badge
                                                                    variant={
                                                                        member.accessLevel ===
                                                                        "OWNER"
                                                                            ? "default"
                                                                            : member.accessLevel ===
                                                                                "WRITE"
                                                                              ? "secondary"
                                                                              : "outline"
                                                                    }
                                                                    className={`mt-1 text-xs ${
                                                                        member.accessLevel ===
                                                                        "OWNER"
                                                                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                                                            : member.accessLevel ===
                                                                                "WRITE"
                                                                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                                                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                                                    }`}
                                                                >
                                                                    {member.accessLevel}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isMemberOwner ? (
                                                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium px-2 py-1 rounded-md bg-amber-500/10">
                                                                    Owner
                                                                </span>
                                                            ) : (
                                                                <Select
                                                                    value={member.accessLevel}
                                                                    onValueChange={(value) => {
                                                                        if (
                                                                            value ===
                                                                            member.accessLevel
                                                                        )
                                                                            return;
                                                                        if (
                                                                            value === "READ" ||
                                                                            value === "WRITE"
                                                                        ) {
                                                                            handleChangeMemberAccess(
                                                                                member.userId,
                                                                                value
                                                                            );
                                                                        }
                                                                    }}
                                                                    disabled={changingMemberAccess}
                                                                >
                                                                    <SelectTrigger
                                                                        size="sm"
                                                                        className="min-w-[100px] bg-background/50 border-border/50"
                                                                    >
                                                                        <SelectValue placeholder="Access" />
                                                                    </SelectTrigger>
                                                                    <SelectContent align="end">
                                                                        <SelectItem value="READ">
                                                                            Read
                                                                        </SelectItem>
                                                                        <SelectItem value="WRITE">
                                                                            Write
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                                                onClick={() =>
                                                                    handleRemoveMember(
                                                                        member.userId
                                                                    )
                                                                }
                                                                disabled={
                                                                    isMemberOwner || removingMember
                                                                }
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </TabsContent>
                            {isProjectPublic && (
                                <TabsContent value="requests" className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={pendingRequestQuery}
                                            onChange={(e) => setPendingRequestQuery(e.target.value)}
                                            placeholder="Search by username..."
                                            className="h-10 bg-muted/30 border-border/40 focus-visible:ring-primary/40 focus-visible:border-primary/40 flex-1 rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRefreshPendingRequests}
                                            className="p-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                                            title="Refresh"
                                        >
                                            <RefreshCw className="size-4" />
                                        </button>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto pt-4 space-y-3">
                                        {gettingPendingRequests ? (
                                            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                                                <Loader2 className="size-5 animate-spin text-primary" />
                                                <span>Loading requests...</span>
                                            </div>
                                        ) : filteredPendingRequests.length > 0 ? (
                                            <div className="space-y-3">
                                                {filteredPendingRequests.map((request) => (
                                                    <div
                                                        key={request.id}
                                                        className="rounded-xl border border-border/40 bg-gradient-to-r from-muted/40 to-muted/20 p-4 transition-all duration-200 hover:from-muted/60 hover:to-muted/40 hover:border-border/60 hover:shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center flex-shrink-0">
                                                                <span className="text-sm font-semibold text-orange-500">
                                                                    {request.username
                                                                        ?.charAt(0)
                                                                        .toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-medium text-foreground">
                                                                {request.username}
                                                            </p>
                                                        </div>
                                                        <div className="mt-4 flex items-center gap-2 pl-12">
                                                            <Button
                                                                size="sm"
                                                                className="h-8 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                                                                onClick={() =>
                                                                    handleReviewRequest(
                                                                        request.id,
                                                                        "APPROVED"
                                                                    )
                                                                }
                                                            >
                                                                Accept
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 px-4 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                                                onClick={() =>
                                                                    handleReviewRequest(
                                                                        request.id,
                                                                        "REJECTED"
                                                                    )
                                                                }
                                                            >
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                                    <Inbox className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    No pending requests
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            )}
                            <TabsContent value="invite" className="px-5 py-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="invite-email"
                                            className="text-sm font-medium"
                                        >
                                            Email Address
                                        </Label>
                                        <Input
                                            id="invite-email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="member@example.com"
                                            className="h-10 bg-muted/30 border-border/40 focus-visible:ring-primary/40 focus-visible:border-primary/40 rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Access Level</Label>
                                        <Select
                                            value={inviteAccessLevel}
                                            onValueChange={(value) => {
                                                if (value === "READ" || value === "WRITE") {
                                                    setInviteAccessLevel(value);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full h-10 bg-muted/30 border-border/40 rounded-lg">
                                                <SelectValue placeholder="Select access" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="READ">Read Only</SelectItem>
                                                <SelectItem value="WRITE">Read & Write</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        className="w-full h-10 bg-primary hover:bg-primary/90 rounded-lg font-medium mt-2"
                                        onClick={handleInviteMember}
                                        disabled={invitingMember || !inviteEmail.trim()}
                                    >
                                        {invitingMember && (
                                            <Loader2 className="size-4 animate-spin mr-2" />
                                        )}
                                        Send Invitation
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

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

                <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                    {activeTab && (
                        <div className="flex items-center shrink-0 px-3 py-1 gap-0.5 text-xs text-muted-foreground border-b bg-muted/20 select-none w-full">
                            {activeTab
                                .replace(/^\//, "")
                                .split("/")
                                .map((part, i, arr) => (
                                    <Fragment key={i}>
                                        {i > 0 && (
                                            <ChevronRight className="size-3 text-muted-foreground/50 shrink-0" />
                                        )}
                                        <span
                                            className={
                                                i === arr.length - 1 ? "text-foreground/80" : ""
                                            }
                                        >
                                            {part}
                                        </span>
                                    </Fragment>
                                ))}
                        </div>
                    )}

                    <div
                        className={cn(
                            "flex flex-1 overflow-hidden min-h-0",
                            terminalPosition === "bottom" ? "flex-col" : "flex-row"
                        )}
                    >
                        <div className="flex-1 overflow-hidden min-h-0 min-w-0">
                            {activeTab && activeFile ? (
                                gettingFileContent ? (
                                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                        Loading…
                                    </div>
                                ) : (
                                    <Editor
                                        key={activeFile.path}
                                        className="h-full"
                                        filePath={activeFile.path}
                                        projectId={projectId}
                                        readOnly={currProject?.currentUserAccess === "READ"}
                                    />
                                )
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                    Select a file to start editing
                                </div>
                            )}
                        </div>

                        {terminalPosition === "bottom" ? (
                            <div
                                onMouseDown={onBottomDragStart}
                                className="h-1.5 cursor-row-resize bg-border hover:bg-primary/50 transition-colors shrink-0 select-none"
                            />
                        ) : (
                            <div
                                onMouseDown={onRightDragStart}
                                className="w-1.5 cursor-col-resize bg-border hover:bg-primary/50 transition-colors shrink-0 select-none"
                            />
                        )}

                        <div
                            style={
                                terminalPosition === "bottom"
                                    ? { height: terminalHeight }
                                    : { width: terminalWidth }
                            }
                            className={cn(
                                "shrink-0 overflow-hidden bg-background flex",
                                terminalPosition === "bottom" ? "flex-row" : "flex-col-reverse"
                            )}
                        >
                            <div
                                className={cn(
                                    "overflow-hidden flex-1",
                                    terminalPosition === "bottom" ? "min-w-0" : "min-h-0"
                                )}
                            >
                                <TerminalLoader wsUrl={wsUrl} />
                            </div>

                            {showPreview && isPreviewSupported && (
                                <>
                                    <div
                                        onMouseDown={
                                            terminalPosition === "bottom"
                                                ? onPreviewHorizDragStart
                                                : onPreviewVertDragStart
                                        }
                                        className={cn(
                                            "bg-border hover:bg-primary/50 transition-colors shrink-0 select-none",
                                            terminalPosition === "bottom"
                                                ? "w-1.5 cursor-col-resize"
                                                : "h-1.5 cursor-row-resize"
                                        )}
                                    />
                                    <div
                                        style={
                                            terminalPosition === "bottom"
                                                ? { width: previewWidth }
                                                : { height: previewHeight }
                                        }
                                        className="shrink-0 overflow-hidden"
                                    >
                                        <div className="flex h-full w-full">
                                            {/* {!isOwner && (
                                                
                                            )} */}

                                            <div className="flex-1 overflow-hidden">
                                                <PreviewPane
                                                    projectId={projectId}
                                                    isRunning={!isBooting && !bootError}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
