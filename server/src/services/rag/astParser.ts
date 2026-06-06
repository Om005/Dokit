import path from "path";

interface ChunkMetadata {
    startRow: number;
    endRow: number;
}

interface Chunk {
    projectId: string;
    filePath: string;
    language: string;
    entityType: string;
    content: string;
    metadata: ChunkMetadata;
}

type Pattern = {
    entityType: string;
    regex: RegExp;
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

const bracePatternsByExt: Record<string, Pattern[]> = {
    ".js": [
        { entityType: "function", regex: /^\s*(export\s+)?(default\s+)?(async\s+)?function\b/ },
        {
            entityType: "function",
            regex: /^\s*(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/,
        },
        { entityType: "class", regex: /^\s*(export\s+)?(default\s+)?class\b/ },
    ],
    ".jsx": [
        { entityType: "function", regex: /^\s*(export\s+)?(default\s+)?(async\s+)?function\b/ },
        {
            entityType: "function",
            regex: /^\s*(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/,
        },
        { entityType: "class", regex: /^\s*(export\s+)?(default\s+)?class\b/ },
    ],
    ".ts": [
        { entityType: "function", regex: /^\s*(export\s+)?(default\s+)?(async\s+)?function\b/ },
        {
            entityType: "function",
            regex: /^\s*(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/,
        },
        { entityType: "class", regex: /^\s*(export\s+)?(default\s+)?(abstract\s+)?class\b/ },
        { entityType: "interface", regex: /^\s*(export\s+)?interface\b/ },
    ],
    ".tsx": [
        { entityType: "function", regex: /^\s*(export\s+)?(default\s+)?(async\s+)?function\b/ },
        {
            entityType: "function",
            regex: /^\s*(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/,
        },
        { entityType: "class", regex: /^\s*(export\s+)?(default\s+)?(abstract\s+)?class\b/ },
        { entityType: "interface", regex: /^\s*(export\s+)?interface\b/ },
    ],
    ".go": [
        { entityType: "function", regex: /^\s*func\b/ },
        { entityType: "type", regex: /^\s*type\s+\w+\s+(struct|interface)\b/ },
    ],
    ".rs": [
        { entityType: "function", regex: /^\s*fn\b/ },
        { entityType: "struct", regex: /^\s*struct\b/ },
        { entityType: "impl", regex: /^\s*impl\b/ },
        { entityType: "trait", regex: /^\s*trait\b/ },
        { entityType: "enum", regex: /^\s*enum\b/ },
    ],
    ".c": [
        { entityType: "struct", regex: /^\s*struct\b/ },
        { entityType: "enum", regex: /^\s*enum\b/ },
        {
            entityType: "function",
            regex: /^\s*[A-Za-z_][\w\s\*\&:<>,~]*\s+[A-Za-z_]\w*\s*\([^;]*\)\s*\{?/,
        },
    ],
    ".cpp": [
        { entityType: "class", regex: /^\s*class\b/ },
        { entityType: "struct", regex: /^\s*struct\b/ },
        { entityType: "enum", regex: /^\s*enum\b/ },
        {
            entityType: "function",
            regex: /^\s*[A-Za-z_][\w\s\*\&:<>,~]*\s+[A-Za-z_]\w*\s*\([^;]*\)\s*\{?/,
        },
    ],
};

const statementPatternsByExt: Record<string, Pattern[]> = {
    ".ts": [{ entityType: "type", regex: /^\s*(export\s+)?type\b/ }],
    ".tsx": [{ entityType: "type", regex: /^\s*(export\s+)?type\b/ }],
};

const indentPatternsByExt: Record<string, Pattern[]> = {
    ".py": [
        { entityType: "function", regex: /^\s*(async\s+)?def\b/ },
        { entityType: "class", regex: /^\s*class\b/ },
    ],
};

function extractTextChunks(
    sourceCode: string,
    filePath: string,
    projectId: string,
    ext: string
): Chunk[] {
    // Split by double newline to separate paragraphs or markdown blocks
    const rawChunks = sourceCode.split(/\n\s*\n/);
    const chunks: Chunk[] = [];
    let currentStartRow = 0;

    for (const block of rawChunks) {
        if (!block.trim()) continue;

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
        currentStartRow += lineCount + 1;
    }
    return chunks;
}

function isCommentLine(line: string, ext: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        return true;
    }
    if (ext === ".py" && trimmed.startsWith("#")) {
        return true;
    }
    return false;
}

function countChar(value: string, target: string): number {
    let count = 0;
    for (let i = 0; i < value.length; i += 1) {
        if (value[i] === target) count += 1;
    }
    return count;
}

function findStatementEndRow(lines: string[], startRow: number): number {
    let braceCount = 0;
    let parenCount = 0;
    let bracketCount = 0;

    for (let j = startRow; j < lines.length; j += 1) {
        const currentLine = lines[j];
        braceCount += countChar(currentLine, "{");
        braceCount -= countChar(currentLine, "}");
        parenCount += countChar(currentLine, "(");
        parenCount -= countChar(currentLine, ")");
        bracketCount += countChar(currentLine, "[");
        bracketCount -= countChar(currentLine, "]");

        if (currentLine.includes(";") && braceCount <= 0 && parenCount <= 0 && bracketCount <= 0) {
            return j;
        }
    }

    return lines.length - 1;
}

function findPattern(line: string, patterns: Pattern[]): Pattern | null {
    for (const pattern of patterns) {
        if (pattern.regex.test(line)) return pattern;
    }
    return null;
}

function extractBraceBlocks(
    sourceCode: string,
    filePath: string,
    projectId: string,
    ext: string,
    patterns: Pattern[]
): Chunk[] {
    const lines = sourceCode.split("\n");
    const chunks: Chunk[] = [];
    const language = languageNameByExt[ext] || ext.replace(".", "");

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (isCommentLine(line, ext)) continue;

        const pattern = findPattern(line, patterns);
        if (!pattern) continue;

        let braceCount = 0;
        let started = false;
        let endRow = i;

        for (let j = i; j < lines.length; j += 1) {
            const currentLine = lines[j];
            braceCount += countChar(currentLine, "{");
            braceCount -= countChar(currentLine, "}");

            if (countChar(currentLine, "{") > 0) started = true;

            if (started && braceCount <= 0) {
                endRow = j;
                break;
            }

            if (j === lines.length - 1) {
                endRow = j;
            }
        }

        if (!started) {
            endRow = findStatementEndRow(lines, i);
        }

        const content = lines.slice(i, endRow + 1).join("\n");

        chunks.push({
            projectId,
            filePath,
            language,
            entityType: pattern.entityType,
            content,
            metadata: {
                startRow: i,
                endRow: endRow,
            },
        });

        i = Math.max(endRow, i);
    }

    return chunks;
}

function getIndentLevel(line: string): number {
    let indent = 0;
    for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === " ") indent += 1;
        else if (ch === "\t") indent += 4;
        else break;
    }
    return indent;
}

function extractIndentBlocks(
    sourceCode: string,
    filePath: string,
    projectId: string,
    ext: string,
    patterns: Pattern[]
): Chunk[] {
    const lines = sourceCode.split("\n");
    const chunks: Chunk[] = [];
    const language = languageNameByExt[ext] || "python";

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (isCommentLine(line, ext)) continue;

        const pattern = findPattern(line, patterns);
        if (!pattern) continue;

        const baseIndent = getIndentLevel(line);
        let endRow = i;

        for (let j = i + 1; j < lines.length; j += 1) {
            const currentLine = lines[j];
            if (!currentLine.trim()) {
                endRow = j;
                continue;
            }
            if (isCommentLine(currentLine, ext)) {
                endRow = j;
                continue;
            }

            const indent = getIndentLevel(currentLine);
            if (indent <= baseIndent) break;
            endRow = j;
        }

        const content = lines.slice(i, endRow + 1).join("\n");

        chunks.push({
            projectId,
            filePath,
            language,
            entityType: pattern.entityType,
            content,
            metadata: {
                startRow: i,
                endRow: endRow,
            },
        });

        i = Math.max(endRow, i);
    }

    return chunks;
}

function extractStatementBlocks(
    sourceCode: string,
    filePath: string,
    projectId: string,
    ext: string,
    patterns: Pattern[]
): Chunk[] {
    const lines = sourceCode.split("\n");
    const chunks: Chunk[] = [];
    const language = languageNameByExt[ext] || ext.replace(".", "");

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (isCommentLine(line, ext)) continue;

        const pattern = findPattern(line, patterns);
        if (!pattern) continue;

        let endRow = i;
        endRow = findStatementEndRow(lines, i);

        const content = lines.slice(i, endRow + 1).join("\n");

        chunks.push({
            projectId,
            filePath,
            language,
            entityType: pattern.entityType,
            content,
            metadata: {
                startRow: i,
                endRow: endRow,
            },
        });

        i = Math.max(endRow, i);
    }

    return chunks;
}

export function extractCodeChunks(
    sourceCode: string,
    filePath: string,
    projectId: string
): Chunk[] {
    const ext = path.extname(filePath);

    if (ext === ".md" || ext === ".txt") {
        return extractTextChunks(sourceCode, filePath, projectId, ext);
    }

    const indentPatterns = indentPatternsByExt[ext];
    if (indentPatterns) {
        const indentChunks = extractIndentBlocks(
            sourceCode,
            filePath,
            projectId,
            ext,
            indentPatterns
        );
        return indentChunks.length > 0
            ? indentChunks
            : extractTextChunks(sourceCode, filePath, projectId, ext);
    }

    const bracePatterns = bracePatternsByExt[ext];
    const statementPatterns = statementPatternsByExt[ext];
    const chunks: Chunk[] = [];

    if (bracePatterns) {
        chunks.push(...extractBraceBlocks(sourceCode, filePath, projectId, ext, bracePatterns));
    }

    if (statementPatterns) {
        chunks.push(
            ...extractStatementBlocks(sourceCode, filePath, projectId, ext, statementPatterns)
        );
    }

    if (chunks.length === 0) {
        return extractTextChunks(sourceCode, filePath, projectId, ext);
    }

    return chunks;
}
