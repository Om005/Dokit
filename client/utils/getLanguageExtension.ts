import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { css } from "@codemirror/lang-css";
import { sass } from "@codemirror/lang-sass";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { xml } from "@codemirror/lang-xml";
import { sql } from "@codemirror/lang-sql";
import { rust } from "@codemirror/lang-rust";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { go } from "@codemirror/lang-go";
import { php } from "@codemirror/lang-php";
import { vue } from "@codemirror/lang-vue";
import { wast } from "@codemirror/lang-wast";
import type { LanguageSupport } from "@codemirror/language";

export function getLanguageExtension(filename: string): LanguageSupport | null {
    const lower = filename.toLowerCase();
    const ext = lower.includes(".") ? lower.split(".").pop()! : "";

    switch (ext) {
        case "js":
        case "mjs":
        case "cjs":
            return javascript();
        case "jsx":
            return javascript({ jsx: true });
        case "ts":
            return javascript({ typescript: true });
        case "tsx":
            return javascript({ jsx: true, typescript: true });

        case "html":
        case "htm":
            return html();
        case "css":
        case "less":
        case "styl":
            return css();
        case "scss":
        case "sass":
            return sass();
        case "vue":
            return vue();

        case "py":
        case "pyw":
            return python();

        case "rs":
            return rust();
        case "c":
        case "h":
        case "cpp":
        case "cc":
        case "cxx":
        case "hpp":
            return cpp();
        case "java":
            return java();
        case "go":
            return go();
        case "php":
        case "erb":
            return php();
        case "wasm":
            return wast();

        case "json":
        case "jsonc":
        case "json5":
            return json();
        case "yaml":
        case "yml":
            return null;
        case "xml":
        case "svg":
            return xml();
        case "sql":
            return sql();
        case "graphql":
        case "gql":
            return null;

        case "md":
        case "mdx":
            return markdown();

        default:
            return null;
    }
}
