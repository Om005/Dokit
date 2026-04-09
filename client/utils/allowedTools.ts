export const ALLOWED_TOOL_KEYS = [
    "python",
    "java",
    "go",
    "ruby",
    "php",
    "rust",
    "cpp-tools",
    "jq",
    "tmux",
    "htop",
    "tree",
    "lsof",
    "zip",
] as const;

export type AllowedToolKey = (typeof ALLOWED_TOOL_KEYS)[number];
