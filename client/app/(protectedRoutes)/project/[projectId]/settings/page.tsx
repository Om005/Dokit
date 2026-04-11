"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { projectActions } from "@/store/project";
import { toast } from "sonner";
import {
    AlertCircle,
    ChevronLeft,
    Loader2,
    Edit2,
    ChevronDown,
    EyeOff,
    Eye,
    RefreshCw,
    Inbox,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AccountPasswordDialog } from "@/components/account-password-dialog";
import { Navbar } from "@/components/navbar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Payload } from "@/types/types";
import { Project } from "@/types/types";

export default function ProjectSettings() {
    const router = useRouter();
    const params = useParams();
    const dispatch = useDispatch<AppDispatch>();
    const {
        changingSettings,
        gettingProjectDetails,
        pendingRequests,
        gettingPendingRequests,
        invitingMember,
        changingMemberAccess,
        removingMember,
    } = useSelector((state: RootState) => state.project);

    const projectId = params.projectId as string;

    const [project, setProject] = useState<Project | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
    const [isPasswordProtected, setIsPasswordProtected] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pendingAction, setPendingAction] = useState<"save" | "delete" | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [accessTab, setAccessTab] = useState<"members" | "invite" | "requests">("members");
    const [pendingRequestQuery, setPendingRequestQuery] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteAccessLevel, setInviteAccessLevel] = useState<"READ" | "WRITE">("READ");
    const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
    const hasFetchedRequests = useRef(false);

    useEffect(() => {
        const fetchProject = async () => {
            const result = await dispatch(projectActions.getProjectDetails({ projectId }));
            const payload = result.payload as Payload<{
                project: Project;
            }>;
            if (payload.success && payload.data?.project) {
                setProjectLoadError(null);
                const fetchedProject = payload.data.project;
                setProject(fetchedProject);
                setName(fetchedProject.name);
                setDescription(fetchedProject.description || "");
                setVisibility(fetchedProject.visibility || "PRIVATE");
                setIsPasswordProtected(fetchedProject.isPasswordProtected || false);
                setIsOwner(fetchedProject.isOwner || false);
            } else {
                setProjectLoadError(payload?.message || "Unable to load project details.");
            }
        };
        fetchProject();
    }, [projectId, dispatch]);

    useEffect(() => {
        if (project && !isEditing) {
            setName(project.name);
            setDescription(project.description || "");
            setVisibility(project.visibility || "PRIVATE");
            setIsPasswordProtected(project.isPasswordProtected || false);
            setNewPassword("");
            setIsOwner(project.isOwner || false);
        }
    }, [project, isEditing]);

    const isProjectPublic = project?.visibility === "PUBLIC";

    useEffect(() => {
        if (!isProjectPublic && accessTab === "requests") {
            setAccessTab("members");
        }
    }, [accessTab, isProjectPublic]);

    useEffect(() => {
        if (!isProjectPublic || accessTab !== "requests") return;
        if (hasFetchedRequests.current) return;
        hasFetchedRequests.current = true;
        dispatch(projectActions.getPendingAccessRequests({ projectId }));
    }, [accessTab, dispatch, isProjectPublic, projectId]);

    if (!project || gettingProjectDetails) {
        if (projectLoadError && !gettingProjectDetails) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center px-4">
                    <Card className="w-full max-w-lg p-6 sm:p-8">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold text-foreground">
                                    Unable to load project
                                </h2>
                                <p className="text-sm text-muted-foreground">{projectLoadError}</p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button variant="outline" onClick={() => router.back()}>
                                        Go back
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            );
        }
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading project details...</p>
                </div>
            </div>
        );
    }

    const createdDate = new Date(project.createdAt);
    const lastAccessedDate = project.lastAccessedAt ? new Date(project.lastAccessedAt) : null;

    const handleSaveSettings = async (accountPassword: string) => {
        if (!name.trim()) {
            toast.error("Project name cannot be empty");
            return;
        }

        if (isPasswordProtected && !newPassword && project.isPasswordProtected === false) {
            toast.error("Password is required when enabling protection");
            return;
        }

        if (
            isPasswordProtected &&
            newPassword &&
            (newPassword.length < 6 || newPassword.length > 50)
        ) {
            toast.error("Password must be 6-50 characters long");
            return;
        }

        try {
            const result = await dispatch(
                projectActions.changeProjectSettings({
                    projectId: project.id,
                    newName: name,
                    description: description,
                    isPasswordProtected,
                    visibility,
                    password: isPasswordProtected ? newPassword || undefined : undefined,
                    accountPassword,
                })
            );
            const payload = result.payload as Payload<{
                project: Project;
            }>;

            if (payload.success && payload.data?.project) {
                const updatedProject = payload.data.project;
                setProject(updatedProject);
                toast.success("Project settings updated successfully");
                setNewPassword("");
                setPasswordDialogOpen(false);
                setIsEditing(false);
            } else {
                toast.error(payload?.message || "Failed to update settings");
            }
        } catch (error) {
            toast.error("An error occurred while updating settings");
        }
    };

    const handleDeleteProject = async (accountPassword: string) => {
        try {
            const result = await dispatch(
                projectActions.deleteProject({
                    projectId,
                    accountPassword,
                })
            );
            const payload = result.payload as Payload<void>;

            if (payload.success) {
                toast.success("Project deleted successfully");
                setShowDeleteConfirm(false);
                router.push("/dashboard/projects");
            } else {
                toast.error(payload?.message || "Failed to delete project");
            }
        } catch (error) {
            toast.error("An error occurred while deleting the project");
        }
    };

    const handleCancel = () => {
        if (project) {
            setName(project.name);
            setDescription(project.description || "");
            setVisibility(project.visibility || "PRIVATE");
            setIsPasswordProtected(project.isPasswordProtected || false);
            setNewPassword("");
        }
        setIsEditing(false);
    };

    const updateMemberList = (member: {
        userId: string;
        username: string;
        accessLevel: string;
    }) => {
        setProject((prev) => {
            if (!prev) return prev;
            const members = prev.members ?? [];
            const existingIndex = members.findIndex((item) => item.userId === member.userId);
            if (existingIndex >= 0) {
                const nextMembers = [...members];
                nextMembers[existingIndex] = { ...nextMembers[existingIndex], ...member };
                return { ...prev, members: nextMembers };
            }
            return { ...prev, members: [...members, member] };
        });
    };

    const handleChangeMemberAccess = async (userId: string, accessLevel: "READ" | "WRITE") => {
        await dispatch(
            projectActions.changeMemberAccess({
                projectId,
                userId,
                newAccessLevel: accessLevel,
            })
        );
        setProject((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                members: prev.members.map((member) =>
                    member.userId === userId ? { ...member, accessLevel } : member
                ),
            };
        });
    };

    const handleRemoveMember = async (userId: string) => {
        await dispatch(projectActions.removeMember({ projectId, userId }));
        setProject((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                members: prev.members.filter((member) => member.userId !== userId),
            };
        });
    };

    const handleRefreshRequests = () => {
        if (!isProjectPublic) return;
        dispatch(projectActions.getPendingAccessRequests({ projectId }));
    };

    const handleReviewRequest = async (requestId: string, status: "APPROVED" | "REJECTED") => {
        const response = await dispatch(projectActions.reviewRequest({ requestId, status }));
        if (status !== "APPROVED") return;
        const payload = response.payload as Payload<{
            user?: { userId: string; username: string; accessLevel: string };
        }>;
        if (payload?.success && payload.data?.user) {
            updateMemberList(payload.data.user);
        }
    };

    const handleInviteMember = async () => {
        if (!inviteEmail.trim()) return;
        const response = await dispatch(
            projectActions.inviteMember({
                projectId,
                email: inviteEmail.trim(),
                accessLevel: inviteAccessLevel,
            })
        );
        const payload = response.payload as Payload<{
            user?: { userId: string; username: string; accessLevel: string };
        }>;
        if (payload?.success && payload.data?.user) {
            updateMemberList(payload.data.user);
            setInviteEmail("");
        }
    };

    const filteredPendingRequests = (pendingRequests ?? []).filter((request) =>
        request.username.toLowerCase().includes(pendingRequestQuery.trim().toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background pt-14">
            <Navbar />
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="mb-4"
                    >
                        <ChevronLeft className="size-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
                    <p className="mt-2 text-muted-foreground">
                        Manage your project settings and configuration
                    </p>
                </div>

                <div className="space-y-6">
                    <Card className="p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold">Project Information</h2>
                            {!isEditing && isOwner && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit2 className="size-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-base font-medium">
                                    Project Name
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={!isEditing}
                                    className="text-base"
                                    placeholder="Enter project name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-base font-medium">
                                    Description
                                </Label>
                                <textarea
                                    id="description"
                                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Add a description for your project"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-base font-medium">Created At</Label>
                                    <div className="text-sm text-foreground p-3 bg-muted rounded-md border">
                                        {createdDate.toLocaleString()}
                                    </div>
                                </div>
                                {lastAccessedDate && (
                                    <div className="space-y-2">
                                        <Label className="text-base font-medium">
                                            Last Accessed
                                        </Label>
                                        <div className="text-sm text-foreground p-3 bg-muted rounded-md border">
                                            {lastAccessedDate.toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2 p-4 bg-muted rounded-md border">
                                    <Label htmlFor="visibility" className="text-base font-medium">
                                        Visibility
                                    </Label>
                                    <div className="flex justify-between items-center">
                                        <p>
                                            This project is currently{" "}
                                            {visibility === "PUBLIC" ? "Public" : "Private"}.
                                        </p>

                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    disabled={changingSettings || !isEditing}
                                                    className="text-base  justify-between gap-2 cursor-pointer"
                                                >
                                                    {visibility === "PUBLIC" ? "Public" : "Private"}
                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-48">
                                                <DropdownMenuItem
                                                    onClick={() => setVisibility("PRIVATE")}
                                                    className="cursor-pointer"
                                                >
                                                    Private
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setVisibility("PUBLIC")}
                                                    className="cursor-pointer"
                                                >
                                                    Public
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {visibility === "PUBLIC"
                                            ? "This project is visible to everyone"
                                            : "This project is only visible to you"}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-4 bg-muted rounded-md border">
                                        <div>
                                            <Label className="text-base font-medium">
                                                Password Protection
                                            </Label>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {isPasswordProtected
                                                    ? "This project requires a password to access"
                                                    : "Add a password to protect this project"}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={isPasswordProtected}
                                            onCheckedChange={setIsPasswordProtected}
                                            disabled={changingSettings || !isEditing}
                                        />
                                    </div>

                                    {isPasswordProtected && isEditing && (
                                        <div className="space-y-2 pl-4">
                                            <Label
                                                htmlFor="password"
                                                className="text-base font-medium"
                                            >
                                                {project.isPasswordProtected
                                                    ? "New Password"
                                                    : "Password"}
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    maxLength={50}
                                                    placeholder="Enter password (6-50 characters)"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="text-base"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="size-4" />
                                                    ) : (
                                                        <Eye className="size-4" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Password must be 6-50 characters long
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={() => {
                                            setPendingAction("save");
                                            setPasswordDialogOpen(true);
                                        }}
                                        disabled={
                                            changingSettings ||
                                            (isPasswordProtected &&
                                                !newPassword &&
                                                project.isPasswordProtected === false) ||
                                            !name.trim() ||
                                            (newPassword.length > 0 &&
                                                (newPassword.length < 6 || newPassword.length > 50))
                                        }
                                        size="lg"
                                    >
                                        {changingSettings ? (
                                            <>
                                                <Loader2 className="size-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleCancel}
                                        disabled={changingSettings}
                                        size="lg"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6 sm:p-8 border-border/40 bg-gradient-to-b from-background to-background/95 shadow-lg">
                        <div className="mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-foreground">
                                        Members & Access
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {isOwner
                                            ? "Manage project members, invites, and access requests."
                                            : "View project members and access levels."}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {isOwner ? (
                            <Tabs
                                value={accessTab}
                                onValueChange={(value) =>
                                    setAccessTab(value as "members" | "invite" | "requests")
                                }
                                className="flex flex-col"
                            >
                                <TabsList
                                    variant="line"
                                    className="w-full justify-start bg-muted/20 rounded-lg p-1"
                                >
                                    <TabsTrigger
                                        value="members"
                                        className="data-[state=active]:text-primary data-[state=active]:bg-background rounded-md"
                                    >
                                        Members
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="invite"
                                        className="data-[state=active]:text-primary data-[state=active]:bg-background rounded-md"
                                    >
                                        Invite User
                                    </TabsTrigger>
                                    {isProjectPublic && (
                                        <TabsTrigger
                                            value="requests"
                                            className="data-[state=active]:text-primary data-[state=active]:bg-background rounded-md"
                                        >
                                            Requests
                                        </TabsTrigger>
                                    )}
                                </TabsList>
                                <TabsContent value="members" className="pt-5">
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {(project.members ?? []).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                                    <Users className="h-7 w-7 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    No members yet
                                                </p>
                                            </div>
                                        ) : (
                                            (project.members ?? []).map((member) => {
                                                const isMemberOwner =
                                                    member.userId === project.ownerId ||
                                                    member.accessLevel === "OWNER";
                                                return (
                                                    <div
                                                        key={member.userId}
                                                        className="rounded-xl border border-border/40 bg-gradient-to-r from-muted/40 to-muted/20 p-4 transition-all duration-200 hover:from-muted/60 hover:to-muted/40 hover:border-border/60 hover:shadow-sm"
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="min-w-0 flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
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
                                                                                : "secondary"
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
                                                                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium px-3 py-1.5 rounded-lg bg-amber-500/10">
                                                                        Owner
                                                                    </span>
                                                                ) : (
                                                                    <DropdownMenu modal={false}>
                                                                        <DropdownMenuTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="min-w-[110px] bg-background/50 border-border/50 rounded-lg justify-between gap-2"
                                                                                disabled={
                                                                                    changingMemberAccess
                                                                                }
                                                                            >
                                                                                {member.accessLevel ===
                                                                                "WRITE"
                                                                                    ? "Read & Write"
                                                                                    : "Read"}
                                                                                <ChevronDown className="h-4 w-4 opacity-50" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent
                                                                            align="end"
                                                                            className="w-40"
                                                                        >
                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    handleChangeMemberAccess(
                                                                                        member.userId,
                                                                                        "READ"
                                                                                    )
                                                                                }
                                                                                className="cursor-pointer"
                                                                            >
                                                                                Read
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    handleChangeMemberAccess(
                                                                                        member.userId,
                                                                                        "WRITE"
                                                                                    )
                                                                                }
                                                                                className="cursor-pointer"
                                                                            >
                                                                                Read & Write
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
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
                                                                        isMemberOwner ||
                                                                        removingMember
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
                                <TabsContent value="invite" className="pt-5">
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
                                                className="h-11 bg-muted/30 border-border/40 focus-visible:ring-primary/40 focus-visible:border-primary/40 rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Access Level
                                            </Label>
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full h-11 bg-muted/30 border-border/40 rounded-lg justify-between gap-2"
                                                    >
                                                        {inviteAccessLevel === "WRITE"
                                                            ? "Read & Write"
                                                            : "Read Only"}
                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-52">
                                                    <DropdownMenuItem
                                                        onClick={() => setInviteAccessLevel("READ")}
                                                        className="cursor-pointer"
                                                    >
                                                        Read Only
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setInviteAccessLevel("WRITE")
                                                        }
                                                        className="cursor-pointer"
                                                    >
                                                        Read & Write
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <Button
                                            className="w-full h-11 bg-primary hover:bg-primary/90 rounded-lg font-medium mt-2"
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
                                {isProjectPublic && (
                                    <TabsContent value="requests" className="pt-5">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={pendingRequestQuery}
                                                onChange={(e) =>
                                                    setPendingRequestQuery(e.target.value)
                                                }
                                                placeholder="Search by username..."
                                                className="h-10 bg-muted/30 border-border/40 focus-visible:ring-primary/40 focus-visible:border-primary/40 flex-1 rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRefreshRequests}
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
                                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center flex-shrink-0">
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
                                                            <div className="mt-4 flex items-center gap-2 pl-[52px]">
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
                                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                                    <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                                        <Inbox className="h-7 w-7 text-muted-foreground" />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        No pending requests
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                )}
                            </Tabs>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {(project.members ?? []).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                            <Users className="h-7 w-7 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            No members yet
                                        </p>
                                    </div>
                                ) : (
                                    (project.members ?? []).map((member) => (
                                        <div
                                            key={member.userId}
                                            className="rounded-xl border border-border/40 bg-gradient-to-r from-muted/40 to-muted/20 p-4 transition-all duration-200 hover:from-muted/60 hover:to-muted/40 hover:border-border/60 hover:shadow-sm"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0 flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
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
                                                                member.accessLevel === "OWNER"
                                                                    ? "default"
                                                                    : "secondary"
                                                            }
                                                            className={`mt-1 text-xs ${
                                                                member.accessLevel === "OWNER"
                                                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                                                    : member.accessLevel === "WRITE"
                                                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                                                      : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                                            }`}
                                                        >
                                                            {member.accessLevel}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {member.accessLevel === "OWNER" && (
                                                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium px-3 py-1.5 rounded-lg bg-amber-500/10">
                                                        Owner
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </Card>

                    {isOwner && (
                        <Card className="border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10 p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <AlertCircle className="size-6 text-red-600 dark:text-red-500" />
                                <h2 className="text-2xl font-semibold text-red-600 dark:text-red-500">
                                    Danger Zone
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-red-700 dark:text-red-400">
                                    Delete your project permanently. This action cannot be undone.
                                </p>
                                <Button
                                    variant="destructive"
                                    size="lg"
                                    className="w-full"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={changingSettings}
                                >
                                    Delete Project
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {isOwner && (
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600 dark:text-red-500">
                                Delete Project
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to permanently delete &ldquo;{project.name}
                                &rdquo;? This action cannot be undone and all project data will be
                                lost.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                variant={"destructive"}
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setPendingAction("delete");
                                    setPasswordDialogOpen(true);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {isOwner && (
                <AccountPasswordDialog
                    open={passwordDialogOpen}
                    onOpenChange={setPasswordDialogOpen}
                    onSubmit={async (password) => {
                        if (pendingAction === "save") {
                            await handleSaveSettings(password);
                        } else if (pendingAction === "delete") {
                            await handleDeleteProject(password);
                        }
                    }}
                    isLoading={changingSettings}
                    title={
                        pendingAction === "delete"
                            ? "Confirm Project Deletion"
                            : "Verify Your Password"
                    }
                    description={
                        pendingAction === "delete"
                            ? "Enter your account password to confirm deletion. This cannot be undone."
                            : "Enter your account password to save changes."
                    }
                />
            )}
        </div>
    );
}
