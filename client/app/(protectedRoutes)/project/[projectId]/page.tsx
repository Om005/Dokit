import TerminalLoader from "@/components/terminal-loader";

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
    const { projectId } = await params;
    const wsUrl = `ws://${process.env.NEXT_PUBLIC_NGINX_HOST}/terminal/${projectId}/ws`;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <div style={{ padding: "8px 16px", background: "#333", color: "#fff" }}>
                Project: {projectId}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
                <TerminalLoader wsUrl={wsUrl} />
            </div>
        </div>
    );
}
