import { useState, useEffect, FormEvent } from "react";
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
    const [addressBar, setAddressBar] = useState("");

    const [iframeSrc, setIframeSrc] = useState("");
    const [iframeKey, setIframeKey] = useState(0);

    useEffect(() => {
        const currentHost = window.location.hostname;
        const ip = currentHost === "localhost" ? "127.0.0.1" : currentHost;
        const protocol = window.location.protocol === "https:" ? "https" : "http";

        const initialUrl = `${protocol}://${defaultPorts[currProject!.stack.toLowerCase()]}-${projectId}.${ip}.nip.io/preview-auth?token=${encodeURIComponent(
            token
        )}`;
        setAddressBar(initialUrl);
        setIframeSrc(initialUrl);
    }, [projectId, token]);

    const handleNavigation = (e: FormEvent) => {
        e.preventDefault();

        let finalUrl = addressBar.trim();

        if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
            finalUrl = `http://${finalUrl}`;
            setAddressBar(finalUrl);
        }

        setIframeSrc(finalUrl);
    };

    const handleRefresh = () => {
        setIframeKey((prev) => prev + 1);
    };

    const handleOpenInNewTab = () => {
        window.open(iframeSrc, "_blank");
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
                        value={addressBar}
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
                ) : iframeSrc ? (
                    <iframe
                        key={`${iframeKey}-${iframeSrc}`}
                        src={iframeSrc}
                        title="Project Preview"
                        className="w-full h-full border-none bg-background"
                        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts"
                    />
                ) : null}
            </div>
        </div>
    );
}
