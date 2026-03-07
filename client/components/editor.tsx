import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { dracula } from "@uiw/codemirror-theme-dracula";
import * as yjs from "yjs";
import { WebsocketProvider } from "y-websocket";
import { yCollab } from "y-codemirror.next";
import { getLanguageExtension } from "@/utils/getLanguageExtension";
import { useEffect, useState } from "react";
import env from "@/config/env";
import { EditorView } from "@codemirror/view";
import { useTheme } from "next-themes";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface EditorProps {
    filePath: string;
    projectId: string;
    // onChange?: (value: string) => void;
    readOnly?: boolean;
    className?: string;
}

export function Editor({
    filePath,
    projectId,
    // onChange,
    readOnly = false,
    className = "",
}: EditorProps) {
    const [yjsExtension, setYjsExtension] = useState<any[]>([]);
    const lineWrapping = useSelector((state: RootState) => state.editor.lineWrapping);
    useEffect(() => {
        if (!projectId || !filePath) return;

        const ydoc = new yjs.Doc();
        const roomName = `${projectId}-${filePath}`;

        const provider = new WebsocketProvider(env.NEXT_PUBLIC_EDITOR_SOCKET_URL!, roomName, ydoc);

        const ytext = ydoc.getText("codemirror");

        const collabExtension = yCollab(ytext, provider.awareness);

        setYjsExtension([collabExtension]);

        return () => {
            provider.destroy();
            ydoc.destroy();
            setYjsExtension([]);
        };
    }, [projectId, filePath]);
    const filename = filePath.split("/").pop() || "untitled.txt";
    const language = getLanguageExtension(filename!);
    // const extensions = language ? [language, ...yjsExtension] : [...yjsExtension];
    const extensions = lineWrapping
        ? language
            ? [language, EditorView.lineWrapping, ...yjsExtension]
            : [EditorView.lineWrapping, ...yjsExtension]
        : language
          ? [language, ...yjsExtension]
          : [...yjsExtension];
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme !== "light";
    return (
        <div className={`overflow-hidden ${className}`} style={{ height: "100%" }}>
            <CodeMirror
                // value={value}
                theme={isDark ? oneDark : undefined}
                // theme={dracula}
                extensions={extensions}
                // onChange={onChange}
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
