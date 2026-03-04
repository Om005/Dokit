import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { getLanguageExtension } from "@/utils/getLanguageExtension";

interface EditorProps {
    filename: string;
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    className?: string;
}

export function Editor({
    filename,
    value,
    onChange,
    readOnly = false,
    className = "",
}: EditorProps) {
    const language = getLanguageExtension(filename);
    const extensions = language ? [language] : [];

    return (
        <div className={`overflow-hidden ${className}`} style={{ height: "100%" }}>
            <CodeMirror
                value={value}
                theme={oneDark}
                // theme={dracula}
                extensions={extensions}
                onChange={onChange}
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
