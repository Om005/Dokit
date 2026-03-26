import { cookies } from "next/headers";
import ProjectPage from "@/components/editor-workspace";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    return <ProjectPage projectId={projectId} token={token || ""} />;
}
