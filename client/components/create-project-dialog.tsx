"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { projectActions } from "@/store/project";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
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

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { creatingProject } = useSelector((state: RootState) => state.project);
    const [projectName, setProjectName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedStack, setSelectedStack] = useState("REACT_VITE");
    const [isPasswordProtected, setIsPasswordProtected] = useState(false);
    const [password, setPassword] = useState("");

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

        if (isPasswordProtected && !password.trim()) {
            toast.error("Password is required when protection is enabled");
            return;
        }

        try {
            const result = await dispatch(
                projectActions.createProject({
                    name: projectName.trim(),
                    description: description.trim() || undefined,
                    stack: selectedStack,
                    password: isPasswordProtected ? password : undefined,
                })
            );
            console.log("Create project result:", result.payload); // Debug log

            if (result.payload?.success) {
                toast.success("Project created successfully!");
                setProjectName("");
                setDescription("");
                setSelectedStack("REACT_VITE");
                setIsPasswordProtected(false);
                setPassword("");
                onOpenChange(false);
            } else {
                toast.error(result.payload?.message || "Failed to create project");
            }
        } catch (error) {
            toast.error("An error occurred while creating the project");
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
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={creatingProject}
                                />
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
                                (isPasswordProtected && !password.trim()) ||
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
