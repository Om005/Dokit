"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/store/store";
import { projectActions } from "@/store/project";
import { Plus, Search, Users } from "lucide-react";
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
        searchParams.get("shared") === "true" ? "shared" : "mine"
    );

    useEffect(() => {
        dispatch(projectActions.fetchProjects());
    }, [dispatch]);

    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);
        if (newTab === "shared") {
            router.push("/dashboard/projects?shared=true");
        } else {
            router.push("/dashboard/projects");
        }
    };

    const myProjects = projects.filter(
        (project) =>
            project.isOwner && project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const sharedProjects = projects.filter(
        (project) =>
            !project.isOwner && project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 space-y-4">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight lg:pt-0 pt-14">
                                Projects
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Manage and create your coding projects
                            </p>
                        </div>
                        <Button
                            className="w-full sm:w-fit"
                            onClick={() => setCreateDialogOpen(true)}
                            size="lg"
                        >
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
                            <TabsTrigger value="mine">
                                My Projects {myProjects.length > 0 && `(${myProjects.length})`}
                            </TabsTrigger>
                            <TabsTrigger value="shared">
                                <Users className="size-4 mr-2" />
                                Shared with Me{" "}
                                {sharedProjects.length > 0 && `(${sharedProjects.length})`}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="mine" className="mt-6">
                            {myProjects.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-12 text-center">
                                    <h3 className="mb-2 text-lg font-semibold">No projects yet</h3>
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
                                    {myProjects.map((project) => (
                                        <ProjectCard key={project.id} {...project} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="shared" className="mt-6">
                            {sharedProjects.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-12 text-center">
                                    <Users className="mx-auto mb-4 size-12 text-muted-foreground" />
                                    <h3 className="mb-2 text-lg font-semibold">
                                        No shared projects
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {searchQuery
                                            ? "No shared projects match your search"
                                            : "Projects shared with you will appear here"}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {sharedProjects.map((project) => (
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
