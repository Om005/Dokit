import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import * as yjs from "yjs";
import { WebsocketProvider } from "y-websocket";
import { yCollab } from "y-codemirror.next";
import { getLanguageExtension } from "@/utils/getLanguageExtension";
import { useEffect, useState } from "react";
import env from "@/config/env";
import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { useTheme } from "next-themes";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const toLightColor = (color: string) => {
    if (color.startsWith("hsl(")) {
        return color.replace("hsl(", "hsla(").replace(")", " / 0.2)");
    }
    return `${color}33`;
};

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
};

interface EditorProps {
    filePath: string;
    projectId: string;
    readOnly?: boolean;
    className?: string;
}

interface AwarenessUser {
    name: string;
    color: string;
    colorLight: string;
}

interface AwarenessState {
    user?: AwarenessUser;
}

interface CollabResources {
    ydoc: yjs.Doc;
    provider: WebsocketProvider;
    extension: Extension;
}

export function Editor(props: EditorProps) {
    const key = `${props.projectId}-${props.filePath}`;
    return <EditorBody key={key} {...props} />;
}

function EditorBody({ filePath, projectId, readOnly = false, className = "" }: EditorProps) {
    const [activeUsers, setActiveUsers] = useState<AwarenessUser[]>([]);
    const [collab] = useState<CollabResources | null>(() => {
        if (!projectId || !filePath) return null;

        const ydoc = new yjs.Doc();
        const roomName = `${projectId}-${filePath}`;
        const provider = new WebsocketProvider(env.NEXT_PUBLIC_EDITOR_SOCKET_URL!, roomName, ydoc);
        const ytext = ydoc.getText("codemirror");
        const extension = yCollab(ytext, provider.awareness);

        return { ydoc, provider, extension };
    });
    const lineWrapping = useSelector((state: RootState) => state.editor.lineWrapping);
    const cursorColor = useSelector((state: RootState) => state.editor.cursorColor);
    const userName = useSelector((state: RootState) => state.auth.username) || "Anonymous";

    useEffect(() => {
        if (!collab || !cursorColor) return;

        const { provider, ydoc } = collab;

        provider.awareness.setLocalStateField("user", {
            name: userName,
            color: cursorColor,
            colorLight: toLightColor(cursorColor),
        });

        const updateUsers = () => {
            const states = Array.from(provider.awareness.getStates().values()) as AwarenessState[];
            const users = states
                .map((state) => state.user)
                .filter((user): user is AwarenessUser => Boolean(user));

            const uniqueUsers = Array.from(new Map(users.map((u) => [u.name, u])).values());

            setActiveUsers(uniqueUsers);
        };

        provider.awareness.on("update", updateUsers);
        updateUsers();

        return () => {
            provider.awareness.off("update", updateUsers);
            provider.destroy();
            ydoc.destroy();
        };
    }, [collab, userName, cursorColor]);

    const filename = filePath.split("/").pop() || "untitled.txt";
    const language = getLanguageExtension(filename!);

    const collabExtension = collab?.extension;
    const collabExtensions = collabExtension ? [collabExtension] : [];
    const extensions = lineWrapping
        ? language
            ? [language, EditorView.lineWrapping, ...collabExtensions]
            : [EditorView.lineWrapping, ...collabExtensions]
        : language
          ? [language, ...collabExtensions]
          : [...collabExtensions];

    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme !== "light";

    return (
        <div className={`relative overflow-hidden ${className}`} style={{ height: "100%" }}>
            {activeUsers.length > 0 && (
                <div className="absolute top-3 right-6 z-10 flex items-center -space-x-2">
                    {activeUsers.map((user, idx) => (
                        <div key={idx} className="group relative">
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold text-white shadow-md ring-2 ring-transparent transition-all duration-200 hover:-translate-y-1 hover:scale-110 hover:ring-white/20 hover:z-20 cursor-default"
                                style={{ backgroundColor: user.color }}
                            >
                                {getInitials(user.name).toUpperCase()}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg shadow-lg border border-border/50 whitespace-nowrap opacity-0 scale-95 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
                                <div
                                    className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-l border-t border-border/50"
                                    style={{ backgroundColor: "inherit" }}
                                />
                                <span className="relative z-10 flex items-center gap-1.5">
                                    <span
                                        className="h-2 w-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: user.color }}
                                    />
                                    {user.name}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <CodeMirror
                theme={isDark ? oneDark : undefined}
                extensions={extensions}
                readOnly={readOnly}
                height="100%"
                style={{ height: "100%", fontSize: 14 }}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    tabSize: 4,
                }}
            />
        </div>
    );
}
