"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/store/store";
import { projectActions } from "@/store/project";
import { Plus, Search, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { ProjectCard } from "@/components/project-card";

export default function ProjectsDashboard() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { projects, loadingProjects } = useSelector((state: RootState) => state.project);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState(
        searchParams.get("archived") === "true" ? "archived" : "active"
    );

    useEffect(() => {
        dispatch(projectActions.fetchProjects());
    }, [dispatch]);

    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);
        if (newTab === "archived") {
            router.push("/dashboard/projects?archived=true");
        } else {
            router.push("/dashboard/projects");
        }
    };

    const activeProjects = projects.filter(
        (project) =>
            !project.isArchived && project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const archivedProjects = projects.filter(
        (project) =>
            project.isArchived && project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 space-y-4">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Manage and create your coding projects
                            </p>
                        </div>
                        <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                            <Plus className="size-4" />
                            New Project
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search projects by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {loadingProjects ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-center">
                            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                            <p className="text-muted-foreground">Loading projects...</p>
                        </div>
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="active">
                                Active Projects{" "}
                                {activeProjects.length > 0 && `(${activeProjects.length})`}
                            </TabsTrigger>
                            <TabsTrigger value="archived">
                                <Archive className="size-4 mr-2" />
                                Archived{" "}
                                {archivedProjects.length > 0 && `(${archivedProjects.length})`}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="active" className="mt-6">
                            {activeProjects.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-12 text-center">
                                    <h3 className="mb-2 text-lg font-semibold">
                                        No active projects
                                    </h3>
                                    <p className="mb-4 text-sm text-muted-foreground">
                                        {searchQuery
                                            ? "No projects match your search"
                                            : "Create your first project to get started"}
                                    </p>
                                    {!searchQuery && (
                                        <Button onClick={() => setCreateDialogOpen(true)}>
                                            <Plus className="size-4" />
                                            Create Project
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {activeProjects.map((project) => (
                                        <ProjectCard key={project.id} {...project} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="archived" className="mt-6">
                            {archivedProjects.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-12 text-center">
                                    <Archive className="mx-auto mb-4 size-12 text-muted-foreground" />
                                    <h3 className="mb-2 text-lg font-semibold">
                                        No archived projects
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {searchQuery
                                            ? "No archived projects match your search"
                                            : "Archive a project to see it here"}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {archivedProjects.map((project) => (
                                        <ProjectCard key={project.id} {...project} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
        </div>
    );
}
