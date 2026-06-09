import { useState, useMemo, FormEvent } from "react";
import { RefreshCw, ExternalLink, Globe } from "lucide-react";
import defaultPorts from "@/utils/defaultPorts";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface PreviewPaneProps {
    projectId: string;
    isRunning: boolean;
    token: string;
}

export function PreviewPane({ projectId, isRunning, token }: PreviewPaneProps) {
    const { currProject } = useSelector((state: RootState) => state.editor);
    const [addressBar, setAddressBar] = useState<string | null>(null);
    const [iframeSrc, setIframeSrc] = useState<string | null>(null);
    const [iframeKey, setIframeKey] = useState(0);
    const initialUrl = useMemo(() => {
        if (!currProject || typeof window === "undefined") return "";

        const protocol = window.location.protocol === "https:" ? "https" : "http";

        const stackKey = currProject.stack.toLowerCase() as keyof typeof defaultPorts;
        const port = defaultPorts[stackKey] ?? defaultPorts.react_vite;

        return `${protocol}://${port}-${projectId}.${process.env.NEXT_PUBLIC_NGINX_HOST}/preview-auth?token=${encodeURIComponent(
            token
        )}`;
    }, [currProject, projectId, token]);

    const resolvedAddressBar = addressBar ?? initialUrl;
    const resolvedIframeSrc = iframeSrc ?? initialUrl;

    const handleNavigation = (e: FormEvent) => {
        e.preventDefault();

        let finalUrl = resolvedAddressBar.trim();

        if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
            finalUrl = `https://${finalUrl}`;
            setAddressBar(finalUrl);
        }

        setIframeSrc(finalUrl);
    };

    const handleRefresh = () => {
        setIframeKey((prev) => prev + 1);
    };

    const handleOpenInNewTab = () => {
        if (resolvedIframeSrc) {
            window.open(resolvedIframeSrc, "_blank");
        }
    };

    return (
        <div className="flex flex-col h-full w-full border-l border-border bg-background">
            <div className="flex items-center px-3 py-2 bg-muted border-b border-border space-x-3">
                <button
                    onClick={handleRefresh}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                    title="Reload"
                >
                    <RefreshCw size={14} />
                </button>

                <form
                    onSubmit={handleNavigation}
                    className="flex flex-1 items-center bg-background border border-input focus-within:border-primary rounded overflow-hidden px-2 transition-colors"
                >
                    <Globe size={12} className="text-muted-foreground mr-2 shrink-0" />
                    <input
                        type="text"
                        value={resolvedAddressBar}
                        onChange={(e) => setAddressBar(e.target.value)}
                        className="flex-1 bg-transparent text-foreground py-1 text-sm focus:outline-none w-full"
                        spellCheck={false}
                    />
                </form>

                <button
                    onClick={handleOpenInNewTab}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                    title="Open in Browser"
                >
                    <ExternalLink size={14} />
                </button>
            </div>

            <div className="flex-1 bg-background relative">
                {!isRunning ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-background">
                        <div className="text-center">
                            <p className="mb-2">Server not running</p>
                            <p className="text-sm text-muted-foreground/60">
                                Start your server in the terminal to view the preview.
                            </p>
                        </div>
                    </div>
                ) : resolvedIframeSrc ? (
                    <iframe
                        key={`${iframeKey}-${resolvedIframeSrc}`}
                        src={resolvedIframeSrc}
                        title="Project Preview"
                        className="w-full h-full border-none bg-background"
                        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts"
                    />
                ) : null}
            </div>
        </div>
    );
}
