"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { projectActions, setPendingPassword } from "@/store/project";
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
import { useRouter } from "next/navigation";
import { FileNode, Payload } from "@/types/types";
import { setCurrProject } from "@/store/editor";

interface CreateProjectFromGithubDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateProjectFromGithubDialog({
    open,
    onOpenChange,
}: CreateProjectFromGithubDialogProps) {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { creatingProjectFromGithub } = useSelector((state: RootState) => state.project);
    const [projectName, setProjectName] = useState("");
    const [description, setDescription] = useState("");
    const [repoUrl, setRepoUrl] = useState("");
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

        if (!repoUrl.trim()) {
            toast.error("GitHub repository link is required");
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
                projectActions.createProjectFromGithub({
                    githubRepoUrl: repoUrl.trim(),
                    name: projectName.trim(),
                    description: description.trim() || undefined,
                    visibility,
                    password: isPasswordProtected ? password : undefined,
                })
            );

            const payload = result.payload as Payload<{
                project: { id: string };
                FileTree: Record<string, FileNode>;
            }>;
            if (payload.success) {
                toast.success("Project imported from GitHub successfully!");

                const projectId = payload.data!.project.id.toString().replaceAll("-", "");
                await dispatch(setCurrProject(payload.data!.project));
                if (isPasswordProtected && password) {
                    dispatch(setPendingPassword(password));
                }

                setProjectName("");
                setDescription("");
                setRepoUrl("");
                setVisibility("PUBLIC");
                setIsPasswordProtected(false);
                setPassword("");
                onOpenChange(false);

                router.push(`/project/${projectId}`);
            } else {
                toast.error(result.payload?.message || "Failed to import project from GitHub");
            }
        } catch (error) {
            toast.error("An error occurred while importing the project");
            console.error("Import project from GitHub error:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Project from GitHub</DialogTitle>
                    <DialogDescription>
                        Import a repository and start working right away
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="github-name">Project Name</Label>
                        <Input
                            id="github-name"
                            placeholder="My Awesome Project"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            disabled={creatingProjectFromGithub}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="github-description">Description (Optional)</Label>
                        <Input
                            id="github-description"
                            placeholder="Brief description of your project"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={creatingProjectFromGithub}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="github-repo">GitHub Repository Link</Label>
                        <Input
                            id="github-repo"
                            type="url"
                            placeholder="https://github.com/owner/repo"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            disabled={creatingProjectFromGithub}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="github-visibility">Visibility</Label>
                        <Select
                            value={visibility}
                            onValueChange={(v) => setVisibility(v as "PUBLIC" | "PRIVATE")}
                        >
                            <SelectTrigger
                                id="github-visibility"
                                disabled={creatingProjectFromGithub}
                            >
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
                                htmlFor="github-password-protected"
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <Lock className="size-4" />
                                <span>Password Protected</span>
                            </Label>
                            <Switch
                                id="github-password-protected"
                                checked={isPasswordProtected}
                                onCheckedChange={setIsPasswordProtected}
                                disabled={creatingProjectFromGithub}
                            />
                        </div>

                        {isPasswordProtected && (
                            <div className="space-y-2 relative">
                                <Label htmlFor="github-password">Password</Label>
                                <Input
                                    id="github-password"
                                    type={showPassword ? "text" : "password"}
                                    maxLength={50}
                                    placeholder="Enter a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={creatingProjectFromGithub}
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
                            disabled={creatingProjectFromGithub}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                creatingProjectFromGithub ||
                                !projectName.trim() ||
                                !repoUrl.trim() ||
                                (isPasswordProtected && (!password.trim() || password.length < 6))
                            }
                        >
                            {creatingProjectFromGithub && <Loader2 className="animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
