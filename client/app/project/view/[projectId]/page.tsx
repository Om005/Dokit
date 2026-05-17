import ViewProjectWorkspace from "@/components/view-project-workspace";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;

    return <ViewProjectWorkspace key={projectId} projectId={projectId} />;
}
