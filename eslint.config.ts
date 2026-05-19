import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import globals from "globals";
import tseslint from "typescript-eslint";

const clientFiles = ["client/**/*.{js,jsx,ts,tsx}"];
const serverJsFiles = ["server/**/*.{js,jsx}"];
const serverTsFiles = ["server/**/*.{ts,tsx}"];

const withClientFiles = (config: Record<string, unknown>) => ({
    ...config,
    files: clientFiles,
});

const withServerFiles = (files: string[]) => (config: Record<string, unknown>) => ({
    ...config,
    files,
    languageOptions: {
        ...(config as { languageOptions?: Record<string, unknown> }).languageOptions,
        ecmaVersion: "latest",
        sourceType: "module",
        globals: {
            ...((config as { languageOptions?: { globals?: Record<string, boolean> } })
                .languageOptions?.globals ?? {}),
            ...globals.node,
        },
    },
});

export default defineConfig([
    globalIgnores([
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
        "**/out/**",
        "**/coverage/**",
        "server/src/generated/**",
        "server/logs/**",
        "server/templates/**",
    ]),
    ...nextVitals.map(withClientFiles),
    ...nextTs.map(withClientFiles),
    {
        files: clientFiles,
        settings: {
            next: {
                rootDir: "client",
            },
        },
        rules: {
            "@next/next/no-html-link-for-pages": "off",
        },
    },
    withServerFiles(serverJsFiles)(js.configs.recommended),
    ...tseslint.configs.recommended.map(withServerFiles(serverTsFiles)),
]);
