"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { projectActions } from "@/store/project";
import { toast } from "sonner";
import { Eye, EyeOff, Globe, Loader2, Lock } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { STACKS } from "@/components/stack-logos";
import { useRouter } from "next/navigation";
import { FileNode, Payload } from "@/types/types";
import { setCurrProject } from "@/store/editor";
import { setPendingPassword } from "@/store/project";

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { creatingProject } = useSelector((state: RootState) => state.project);
    const [projectName, setProjectName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedStack, setSelectedStack] = useState("REACT_VITE");
    const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
    const [isPasswordProtected, setIsPasswordProtected] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!projectName.trim()) {
            toast.error("Project name is required");
            return;
        }

        if (!selectedStack) {
            toast.error("Please select a stack");
            return;
        }

        if (isPasswordProtected) {
            if (!password.trim()) {
                toast.error("Password is required when protection is enabled");
                return;
            }
            if (password.length < 6) {
                toast.error("Password must be at least 6 characters");
                return;
            }
            if (password.length > 50) {
                toast.error("Password must be at most 50 characters");
                return;
            }
        }

        try {
            const result = await dispatch(
                projectActions.createProject({
                    name: projectName.trim(),
                    description: description.trim() || undefined,
                    stack: selectedStack,
                    visibility,
                    password: isPasswordProtected ? password : undefined,
                })
            );

            const payload = result.payload as Payload<{
                project: { id: string };
                FileTree: Record<string, FileNode>;
            }>;
            if (payload.success) {
                toast.success("Project created successfully!");

                const projectId = payload.data!.project.id.toString().replaceAll("-", "");
                await dispatch(setCurrProject(payload.data!.project));
                if (isPasswordProtected && password) {
                    dispatch(setPendingPassword(password));
                }

                setProjectName("");
                setDescription("");
                setSelectedStack("REACT_VITE");
                setVisibility("PUBLIC");
                setIsPasswordProtected(false);
                setPassword("");
                onOpenChange(false);

                router.push(`/project/${projectId}`);
            } else {
                toast.error(result.payload?.message || "Failed to create project");
            }
        } catch (error) {
            toast.error("An error occurred while creating the project");
            console.error("Create project error:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Set up a new project with your preferred stack
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                            id="name"
                            placeholder="My Awesome Project"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            disabled={creatingProject}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                            id="description"
                            placeholder="Brief description of your project"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={creatingProject}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="stack">Tech Stack</Label>
                        <Select value={selectedStack} onValueChange={setSelectedStack}>
                            <SelectTrigger id="stack" disabled={creatingProject}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STACKS.map((stack) => {
                                    const Icon = stack.icon;
                                    return (
                                        <SelectItem key={stack.id} value={stack.id}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="size-4" />
                                                {stack.name}
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="visibility">Visibility</Label>
                        <Select
                            value={visibility}
                            onValueChange={(v) => setVisibility(v as "PUBLIC" | "PRIVATE")}
                        >
                            <SelectTrigger id="visibility" disabled={creatingProject}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PUBLIC">
                                    <div className="flex items-center gap-2">
                                        <Globe className="size-4" />
                                        Public
                                    </div>
                                </SelectItem>
                                <SelectItem value="PRIVATE">
                                    <div className="flex items-center gap-2">
                                        <Lock className="size-4" />
                                        Private
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor="password-protected"
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <Lock className="size-4" />
                                <span>Password Protected</span>
                            </Label>
                            <Switch
                                id="password-protected"
                                checked={isPasswordProtected}
                                onCheckedChange={setIsPasswordProtected}
                                disabled={creatingProject}
                            />
                        </div>

                        {isPasswordProtected && (
                            <div className="space-y-2 relative">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    maxLength={50}
                                    placeholder="Enter a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={creatingProject}
                                />
                                <p className="text-xs text-muted-foreground">6-50 characters</p>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={creatingProject}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                creatingProject ||
                                !projectName.trim() ||
                                (isPasswordProtected &&
                                    (!password.trim() || password.length < 6)) ||
                                !selectedStack
                            }
                        >
                            {creatingProject && <Loader2 className="animate-spin" />}
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
