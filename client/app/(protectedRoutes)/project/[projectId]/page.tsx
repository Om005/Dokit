"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function ProjectPage() {
    const currProject = useSelector((state: RootState) => state.editor.currProject);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
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
                <div className="flex flex-1 overflow-hidden">
                    {/* main editor area — replace with CodeEditorSection or similar */}
                    <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
                        Select a file to start editing
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
