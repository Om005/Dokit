"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { projectActions } from "@/store/project";
import { toast } from "sonner";
import { AlertCircle, ChevronLeft, Loader2, Edit2, ChevronDown, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
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
    const { changingSettings, gettingProjectDetails } = useSelector(
        (state: RootState) => state.project
    );

    const projectId = params.projectId as string;

    const [project, setProject] = useState<Project | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
    const [isArchived, setIsArchived] = useState(false);
    const [isPasswordProtected, setIsPasswordProtected] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pendingAction, setPendingAction] = useState<"save" | "delete" | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const fetchProject = async () => {
            const result = await dispatch(projectActions.getProjectDetails({ projectId }));
            const payload = result.payload as Payload<{
                project: Project;
            }>;
            if (payload.success && payload.data?.project) {
                const fetchedProject = payload.data.project;
                setProject(fetchedProject);
                setName(fetchedProject.name);
                setDescription(fetchedProject.description || "");
                setVisibility(fetchedProject.visibility || "PRIVATE");
                setIsArchived(fetchedProject.isArchived || false);
                setIsPasswordProtected(fetchedProject.isPasswordProtected || false);
            }
        };
        fetchProject();
    }, [projectId, dispatch]);

    useEffect(() => {
        if (project && !isEditing) {
            setName(project.name);
            setDescription(project.description || "");
            setVisibility(project.visibility || "PRIVATE");
            setIsArchived(project.isArchived || false);
            setIsPasswordProtected(project.isPasswordProtected || false);
            setNewPassword("");
        }
    }, [project, isEditing]);

    if (!project || gettingProjectDetails) {
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
                    name: project.name,
                    newName: name,
                    isArchived,
                    isPasswordProtected,
                    description: description,
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
            setIsArchived(project.isArchived || false);
            setIsPasswordProtected(project.isPasswordProtected || false);
            setNewPassword("");
        }
        setIsEditing(false);
    };

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
                            {!isEditing && (
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

                            <div className="flex items-center justify-between p-4 bg-muted rounded-md border">
                                <div>
                                    <Label className="text-base font-medium">
                                        {isArchived ? "Unarchive" : "Archive"} Project
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {isArchived
                                            ? "This project is archived. Unarchive to show in active projects."
                                            : "Archive this project to hide from active projects."}
                                    </p>
                                </div>
                                <Switch
                                    checked={isArchived}
                                    onCheckedChange={setIsArchived}
                                    disabled={changingSettings || !isEditing}
                                />
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
                </div>
            </div>

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600 dark:text-red-500">
                            Delete Project
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete &ldquo;{project.name}
                            &rdquo;? This action cannot be undone and all project data will be lost.
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
                    pendingAction === "delete" ? "Confirm Project Deletion" : "Verify Your Password"
                }
                description={
                    pendingAction === "delete"
                        ? "Enter your account password to confirm deletion. This cannot be undone."
                        : "Enter your account password to save changes."
                }
            />
        </div>
    );
}
