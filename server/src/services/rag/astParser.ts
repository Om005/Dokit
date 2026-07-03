import path from "path";
import Parser from "tree-sitter";

interface ChunkMetadata {
    startRow: number;
    endRow: number;
    entityName?: string;
}

export interface Chunk {
    projectId: string;
    filePath: string;
    language: string;
    entityType: string;
    content: string;
    metadata: ChunkMetadata;
}

// Dynamically require languages so the server doesn't instantly crash if a module fails to load on a new deployment environment
let JavaScript: unknown,
    TypeScript: unknown,
    TSX: unknown,
    Python: unknown,
    Rust: unknown,
    Go: unknown,
    C: unknown,
    Cpp: unknown;

/* eslint-disable @typescript-eslint/no-require-imports */
try {
    JavaScript = require("tree-sitter-javascript");
    const ts = require("tree-sitter-typescript");
    TypeScript = ts.typescript;
    TSX = ts.tsx;
    Python = require("tree-sitter-python");
    Rust = require("tree-sitter-rust");
    Go = require("tree-sitter-go");
    C = require("tree-sitter-c");
    Cpp = require("tree-sitter-cpp");
} catch (error) {
    console.warn("Tree-sitter languages not fully loaded. Falling back gracefully.", error);
}
/* eslint-enable @typescript-eslint/no-require-imports */

const languageMap: Record<string, unknown> = {
    ".js": JavaScript,
    ".jsx": TSX, // Using TSX for JSX safely parses React
    ".ts": TypeScript,
    ".tsx": TSX,
    ".py": Python,
    ".rs": Rust,
    ".go": Go,
    ".c": C,
    ".cpp": Cpp,
};

const languageNameByExt: Record<string, string> = {
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".py": "python",
    ".rs": "rust",
    ".go": "go",
    ".c": "c",
    ".cpp": "cpp",
};

const targetNodeTypes = new Set([
    // JS / TS
    "function_declaration",
    "class_declaration",
    "abstract_class_declaration",
    "method_definition",
    "interface_declaration",
    "type_alias_declaration",
    "lexical_declaration", // let/const (checked for arrow func)
    "variable_declaration", // var (checked for arrow func)

    // Python
    "function_definition",
    "class_definition",

    // Rust
    "function_item",
    "struct_item",
    "enum_item",
    "impl_item",
    "trait_item",

    // Go
    "function_declaration",
    "method_declaration",
    "type_declaration",

    // C / C++
    "function_definition",
    "struct_specifier",
    "class_specifier",
    "enum_specifier",
]);

function getEntityName(node: Parser.SyntaxNode): string | undefined {
    const nameNode = node.childForFieldName("name");
    if (nameNode) return nameNode.text;

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (
            child &&
            (child.type === "identifier" ||
                child.type === "type_identifier" ||
                child.type === "name")
        ) {
            return child.text;
        }
    }
    return undefined;
}

function extractTextChunks(
    sourceCode: string,
    filePath: string,
    projectId: string,
    ext: string
): Chunk[] {
    const rawChunks = sourceCode.split(/\n\s*\n/);
    const chunks: Chunk[] = [];
    let currentStartRow = 0;

    for (const block of rawChunks) {
        if (!block.trim()) {
            const lineCount = block.split("\n").length;
            currentStartRow += lineCount;
            continue;
        }

        const lineCount = block.split("\n").length;
        chunks.push({
            projectId,
            filePath,
            language: ext === ".md" ? "markdown" : "text",
            entityType: "text_block",
            content: block.trim(),
            metadata: {
                startRow: currentStartRow,
                endRow: currentStartRow + lineCount - 1,
            },
        });
        currentStartRow += lineCount;
    }
    return chunks;
}

function traverseTree(
    node: Parser.SyntaxNode,
    chunks: Chunk[],
    filePath: string,
    projectId: string,
    language: string
) {
    let shouldExtract = false;
    let entityType = node.type;
    let entityName = getEntityName(node);

    if (targetNodeTypes.has(node.type)) {
        shouldExtract = true;

        // Handle JS/TS Arrow functions assigned to variables
        if (node.type === "lexical_declaration" || node.type === "variable_declaration") {
            shouldExtract = false;
            for (const child of node.namedChildren) {
                if (child.type === "variable_declarator") {
                    const value = child.childForFieldName("value");
                    if (value && value.type === "arrow_function") {
                        shouldExtract = true;
                        entityType = "function";
                        const nameNode = child.childForFieldName("name");
                        if (nameNode) entityName = nameNode.text;
                        break;
                    }
                }
            }
        }
    }

    if (shouldExtract) {
        const cleanType = entityType
            .replace("_declaration", "")
            .replace("_definition", "")
            .replace("_item", "")
            .replace("_specifier", "");

        chunks.push({
            projectId,
            filePath,
            language,
            entityType: cleanType,
            content: node.text,
            metadata: {
                startRow: node.startPosition.row,
                endRow: node.endPosition.row,
                entityName,
            },
        });
    }

    for (const child of node.namedChildren) {
        traverseTree(child, chunks, filePath, projectId, language);
    }
}

function deduplicateChunks(chunks: Chunk[]): Chunk[] {
    const deduped: Chunk[] = [];
    const seenRanges = new Set<string>();

    const sorted = [...chunks].sort((a, b) => a.metadata.startRow - b.metadata.startRow);

    for (const chunk of sorted) {
        const key = `${chunk.metadata.startRow}-${chunk.metadata.endRow}`;
        if (!seenRanges.has(key)) {
            seenRanges.add(key);
            deduped.push(chunk);
        }
    }
    return deduped;
}

export function extractCodeChunks(
    sourceCode: string,
    filePath: string,
    projectId: string
): Chunk[] {
    const ext = path.extname(filePath);
    const grammar = languageMap[ext];

    if (!grammar) {
        return extractTextChunks(sourceCode, filePath, projectId, ext);
    }

    try {
        const parser = new Parser();
        parser.setLanguage(grammar);

        const tree = parser.parse(sourceCode);
        const chunks: Chunk[] = [];

        traverseTree(
            tree.rootNode,
            chunks,
            filePath,
            projectId,
            languageNameByExt[ext] || ext.replace(".", "")
        );

        if (chunks.length === 0) {
            return extractTextChunks(sourceCode, filePath, projectId, ext);
        }

        return deduplicateChunks(chunks);
    } catch (error) {
        console.warn(
            `[Tree-sitter] Failed to parse ${filePath}, falling back to text chunking.`,
            error
        );
        return extractTextChunks(sourceCode, filePath, projectId, ext);
    }
}
