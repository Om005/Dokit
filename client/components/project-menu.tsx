"use client";

import { useRouter } from "next/navigation";
import { MoreVertical, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectMenuProps {
    projectId: string;
    projectName: string;
}

export function ProjectMenu({ projectId, projectName }: ProjectMenuProps) {
    const router = useRouter();

    const handleSettings = () => {
        router.push(`/project/${projectId}/settings`);
    };

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSettings}>
                    <Settings className="mr-2 size-4" />
                    Settings
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
