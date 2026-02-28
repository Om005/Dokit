"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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

interface ProjectPasswordDialogProps {
    open: boolean;
    projectName: string;
    onOpenChange: (open: boolean) => void;
    onSubmit: (password: string) => Promise<void>;
    isLoading?: boolean;
}

export function ProjectPasswordDialog({
    open,
    projectName,
    onOpenChange,
    onSubmit,
    isLoading = false,
}: ProjectPasswordDialogProps) {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password.trim()) {
            return;
        }

        try {
            await onSubmit(password);
            setPassword("");
        } catch (error) {}
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Password Protected Project</DialogTitle>
                    <DialogDescription>
                        &ldquo;{projectName}&rdquo; is password protected. Enter the password to
                        continue.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-password">Password</Label>
                        <div className="relative">
                            <Input
                                id="project-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter project password"
                                maxLength={50}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                autoFocus
                            />
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
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setPassword("");
                                onOpenChange(false);
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !password.trim()}>
                            {isLoading && <Loader2 className="animate-spin" />}
                            Unlock Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
