import { AiAssistant } from "@/components/chat";

export default async function AiAssistantPage({
    params,
}: {
    params: Promise<{ projectId: string }>;
}) {
    const { projectId } = await params;

    return <AiAssistant projectId={projectId} />;
}
