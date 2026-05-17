"use client";

import { Fragment, useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import {
    AlignLeft,
    AlertCircle,
    ChevronRight,
    FileIcon,
    Moon,
    Sun,
    WrapText,
    X,
} from "lucide-react";

import { accountActions } from "@/store/account";
import { toggleLineWrapping } from "@/store/editor";
import { AppDispatch, RootState } from "@/store/store";
import { ApiResponse, ViewFileNode } from "@/types/types";
import { getLanguageExtension } from "@/utils/getLanguageExtension";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar";

interface ViewProjectWorkspaceProps {
    projectId: string;
}

const formatProjectId = (value: string) => {
    if (!value || value.includes("-") || value.length !== 32) return value;

    return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
};

function getFileIconId(name: string): string {
    const lower = name.toLowerCase();

    const nameMap: Record<string, string> = {
        "package.json": "vscode-icons:file-type-node",
        "package-lock.json": "vscode-icons:file-type-npm",
        "pnpm-lock.yaml": "vscode-icons:file-type-npm",
        "yarn.lock": "vscode-icons:file-type-yarn",
        ".npmrc": "vscode-icons:file-type-npm",
        ".nvmrc": "vscode-icons:file-type-node",
        "tsconfig.json": "vscode-icons:file-type-tsconfig",
        ".babelrc": "vscode-icons:file-type-babel",
        "babel.config.js": "vscode-icons:file-type-babel",
        "babel.config.ts": "vscode-icons:file-type-babel",
        ".eslintrc": "vscode-icons:file-type-eslint",
        ".eslintignore": "vscode-icons:file-type-eslint",
        ".prettierrc": "vscode-icons:file-type-prettier",
        ".prettierignore": "vscode-icons:file-type-prettier",
        ".gitignore": "vscode-icons:file-type-git",
        ".gitattributes": "vscode-icons:file-type-git",
        ".gitmodules": "vscode-icons:file-type-git",
        dockerfile: "vscode-icons:file-type-docker",
        "docker-compose.yml": "vscode-icons:file-type-docker",
        "docker-compose.yaml": "vscode-icons:file-type-docker",
        ".dockerignore": "vscode-icons:file-type-docker",
        makefile: "vscode-icons:file-type-makefile",
        gemfile: "vscode-icons:file-type-ruby",
        "gemfile.lock": "vscode-icons:file-type-ruby",
        "readme.md": "vscode-icons:file-type-markdown",
        readme: "vscode-icons:file-type-markdown",
        license: "vscode-icons:file-type-license",
        licence: "vscode-icons:file-type-license",
        "changelog.md": "vscode-icons:file-type-changelog",
        ".editorconfig": "vscode-icons:file-type-editorconfig",
        ".env": "vscode-icons:file-type-dotenv",
        ".env.local": "vscode-icons:file-type-dotenv",
        ".env.example": "vscode-icons:file-type-dotenv",
        ".env.development": "vscode-icons:file-type-dotenv",
        ".env.production": "vscode-icons:file-type-dotenv",
        "vite.config.ts": "vscode-icons:file-type-vite",
        "vite.config.js": "vscode-icons:file-type-vite",
        "vitest.config.ts": "vscode-icons:file-type-vitest",
        "vitest.config.js": "vscode-icons:file-type-vitest",
        "next.config.ts": "vscode-icons:file-type-next",
        "next.config.js": "vscode-icons:file-type-next",
        "next.config.mjs": "vscode-icons:file-type-next",
        "tailwind.config.ts": "vscode-icons:file-type-tailwind",
        "tailwind.config.js": "vscode-icons:file-type-tailwind",
        "postcss.config.js": "vscode-icons:file-type-postcss",
        "postcss.config.mjs": "vscode-icons:file-type-postcss",
        "webpack.config.js": "vscode-icons:file-type-webpack",
        "webpack.config.ts": "vscode-icons:file-type-webpack",
        "jest.config.js": "vscode-icons:file-type-jest",
        "jest.config.ts": "vscode-icons:file-type-jest",
        "rollup.config.js": "vscode-icons:file-type-rollup",
        "rollup.config.ts": "vscode-icons:file-type-rollup",
        "svelte.config.js": "vscode-icons:file-type-svelte",
        "astro.config.mjs": "vscode-icons:file-type-astro",
        "astro.config.ts": "vscode-icons:file-type-astro",
        "prisma.config.ts": "vscode-icons:file-type-prisma",
        ".stylelintrc": "vscode-icons:file-type-stylelint",
        ".mocharc.yml": "vscode-icons:file-type-mocha",
        ".mocharc.js": "vscode-icons:file-type-mocha",
    };
    if (nameMap[lower]) return nameMap[lower];

    if (lower.startsWith(".eslintrc")) return "vscode-icons:file-type-eslint";
    if (lower.startsWith(".prettierrc")) return "vscode-icons:file-type-prettier";
    if (lower.startsWith("tsconfig.")) return "vscode-icons:file-type-tsconfig";
    if (lower.startsWith(".env")) return "vscode-icons:file-type-dotenv";
    if (lower.startsWith("dockerfile")) return "vscode-icons:file-type-docker";
    if (lower.startsWith("license")) return "vscode-icons:file-type-license";

    const ext = lower.includes(".") ? lower.split(".").pop()! : "";
    const extMap: Record<string, string> = {
        ts: "vscode-icons:file-type-typescript",
        tsx: "vscode-icons:file-type-reactts",
        js: "vscode-icons:file-type-js",
        jsx: "vscode-icons:file-type-reactjs",
        mjs: "vscode-icons:file-type-js",
        cjs: "vscode-icons:file-type-js",

        html: "vscode-icons:file-type-html",
        htm: "vscode-icons:file-type-html",
        css: "vscode-icons:file-type-css",
        scss: "vscode-icons:file-type-scss",
        sass: "vscode-icons:file-type-sass",
        less: "vscode-icons:file-type-less",
        styl: "vscode-icons:file-type-stylus",
        vue: "vscode-icons:file-type-vue",
        svelte: "vscode-icons:file-type-svelte",
        astro: "vscode-icons:file-type-astro",

        py: "vscode-icons:file-type-python",
        pyw: "vscode-icons:file-type-python",
        ipynb: "vscode-icons:file-type-jupyter",

        c: "vscode-icons:file-type-c",
        h: "vscode-icons:file-type-c",
        cpp: "vscode-icons:file-type-cpp",
        cc: "vscode-icons:file-type-cpp",
        cxx: "vscode-icons:file-type-cpp",
        hpp: "vscode-icons:file-type-cpp",
        cs: "vscode-icons:file-type-csharp",
        rs: "vscode-icons:file-type-rust",
        go: "vscode-icons:file-type-go",
        java: "vscode-icons:file-type-java",
        kt: "vscode-icons:file-type-kotlin",
        kts: "vscode-icons:file-type-kotlin",
        scala: "vscode-icons:file-type-scala",
        swift: "vscode-icons:file-type-swift",
        dart: "vscode-icons:file-type-dart",
        lua: "vscode-icons:file-type-lua",
        rb: "vscode-icons:file-type-ruby",
        erb: "vscode-icons:file-type-ruby",
        php: "vscode-icons:file-type-php",
        r: "vscode-icons:file-type-r",
        ex: "vscode-icons:file-type-elixir",
        exs: "vscode-icons:file-type-elixir",
        erl: "vscode-icons:file-type-erlang",
        hs: "vscode-icons:file-type-haskell",
        fs: "vscode-icons:file-type-fsharp",
        fsx: "vscode-icons:file-type-fsharp",
        ml: "vscode-icons:file-type-ocaml",
        mli: "vscode-icons:file-type-ocaml",
        jl: "vscode-icons:file-type-julia",
        nim: "vscode-icons:file-type-nim",
        zig: "vscode-icons:file-type-zig",
        clj: "vscode-icons:file-type-clojure",
        cljs: "vscode-icons:file-type-clojure",
        wasm: "vscode-icons:file-type-wasm",

        json: "vscode-icons:file-type-json",
        jsonc: "vscode-icons:file-type-json",
        json5: "vscode-icons:file-type-json",
        yaml: "vscode-icons:file-type-yaml",
        yml: "vscode-icons:file-type-yaml",
        toml: "vscode-icons:file-type-toml",
        xml: "vscode-icons:file-type-xml",
        csv: "vscode-icons:file-type-excel",
        graphql: "vscode-icons:file-type-graphql",
        gql: "vscode-icons:file-type-graphql",
        prisma: "vscode-icons:file-type-prisma",
        sql: "vscode-icons:file-type-sql",

        md: "vscode-icons:file-type-markdown",
        mdx: "vscode-icons:file-type-mdx",
        txt: "vscode-icons:file-type-text",
        pdf: "vscode-icons:file-type-pdf",

        png: "vscode-icons:file-type-image",
        jpg: "vscode-icons:file-type-image",
        jpeg: "vscode-icons:file-type-image",
        gif: "vscode-icons:file-type-image",
        webp: "vscode-icons:file-type-image",
        ico: "vscode-icons:file-type-image",
        bmp: "vscode-icons:file-type-image",
        svg: "vscode-icons:file-type-svg",

        sh: "vscode-icons:file-type-shell",
        bash: "vscode-icons:file-type-shell",
        zsh: "vscode-icons:file-type-shell",
        fish: "vscode-icons:file-type-shell",
        ps1: "vscode-icons:file-type-powershell",
        bat: "vscode-icons:file-type-bat",
        cmd: "vscode-icons:file-type-bat",

        ttf: "vscode-icons:file-type-font",
        otf: "vscode-icons:file-type-font",
        woff: "vscode-icons:file-type-font",
        woff2: "vscode-icons:file-type-font",

        zip: "vscode-icons:file-type-zip",
        tar: "vscode-icons:file-type-zip",
        gz: "vscode-icons:file-type-zip",
        "7z": "vscode-icons:file-type-zip",
        rar: "vscode-icons:file-type-zip",

        lock: "vscode-icons:file-type-lock",
        log: "vscode-icons:file-type-log",
        cert: "vscode-icons:file-type-key",
        pem: "vscode-icons:file-type-key",
        key: "vscode-icons:file-type-key",
        mp3: "vscode-icons:file-type-audio",
        wav: "vscode-icons:file-type-audio",
        mp4: "vscode-icons:file-type-video",
        mov: "vscode-icons:file-type-video",
        avi: "vscode-icons:file-type-video",
        mkv: "vscode-icons:file-type-video",
    };
    return extMap[ext] ?? "vscode-icons:default-file";
}

function getFolderIconIds(name: string): [string, string] {
    const lower = name.toLowerCase();
    const map: Record<string, [string, string]> = {
        src: ["vscode-icons:folder-type-src", "vscode-icons:folder-type-src-opened"],
        source: ["vscode-icons:folder-type-src", "vscode-icons:folder-type-src-opened"],
        lib: ["vscode-icons:folder-type-lib", "vscode-icons:folder-type-lib-opened"],
        libs: ["vscode-icons:folder-type-lib", "vscode-icons:folder-type-lib-opened"],
        public: ["vscode-icons:folder-type-public", "vscode-icons:folder-type-public-opened"],
        static: ["vscode-icons:folder-type-static", "vscode-icons:folder-type-static-opened"],
        assets: ["vscode-icons:folder-type-asset", "vscode-icons:folder-type-asset-opened"],
        images: ["vscode-icons:folder-type-images", "vscode-icons:folder-type-images-opened"],
        img: ["vscode-icons:folder-type-images", "vscode-icons:folder-type-images-opened"],
        icons: ["vscode-icons:folder-type-icons", "vscode-icons:folder-type-icons-opened"],
        fonts: ["vscode-icons:folder-type-fonts", "vscode-icons:folder-type-fonts-opened"],
        styles: ["vscode-icons:folder-type-styles", "vscode-icons:folder-type-styles-opened"],
        style: ["vscode-icons:folder-type-styles", "vscode-icons:folder-type-styles-opened"],
        css: ["vscode-icons:folder-type-css", "vscode-icons:folder-type-css-opened"],
        scss: ["vscode-icons:folder-type-sass", "vscode-icons:folder-type-sass-opened"],
        sass: ["vscode-icons:folder-type-sass", "vscode-icons:folder-type-sass-opened"],
        components: [
            "vscode-icons:folder-type-component",
            "vscode-icons:folder-type-component-opened",
        ],
        component: [
            "vscode-icons:folder-type-component",
            "vscode-icons:folder-type-component-opened",
        ],
        pages: ["vscode-icons:folder-type-pages", "vscode-icons:folder-type-pages-opened"],
        views: ["vscode-icons:folder-type-views", "vscode-icons:folder-type-views-opened"],
        layouts: ["vscode-icons:folder-type-layout", "vscode-icons:folder-type-layout-opened"],
        hooks: ["vscode-icons:folder-type-hook", "vscode-icons:folder-type-hook-opened"],
        utils: ["vscode-icons:folder-type-utils", "vscode-icons:folder-type-utils-opened"],
        util: ["vscode-icons:folder-type-utils", "vscode-icons:folder-type-utils-opened"],
        helpers: ["vscode-icons:folder-type-helper", "vscode-icons:folder-type-helper-opened"],
        config: ["vscode-icons:folder-type-config", "vscode-icons:folder-type-config-opened"],
        configs: ["vscode-icons:folder-type-config", "vscode-icons:folder-type-config-opened"],
        types: ["vscode-icons:folder-type-typings", "vscode-icons:folder-type-typings-opened"],
        typings: ["vscode-icons:folder-type-typings", "vscode-icons:folder-type-typings-opened"],
        interfaces: ["vscode-icons:folder-type-typings", "vscode-icons:folder-type-typings-opened"],
        api: ["vscode-icons:folder-type-api", "vscode-icons:folder-type-api-opened"],
        routes: ["vscode-icons:folder-type-routes", "vscode-icons:folder-type-routes-opened"],
        route: ["vscode-icons:folder-type-routes", "vscode-icons:folder-type-routes-opened"],
        middleware: [
            "vscode-icons:folder-type-middleware",
            "vscode-icons:folder-type-middleware-opened",
        ],
        middlewares: [
            "vscode-icons:folder-type-middleware",
            "vscode-icons:folder-type-middleware-opened",
        ],
        services: ["vscode-icons:folder-type-services", "vscode-icons:folder-type-services-opened"],
        service: ["vscode-icons:folder-type-services", "vscode-icons:folder-type-services-opened"],
        store: [
            "vscode-icons:folder-type-redux-store",
            "vscode-icons:folder-type-redux-store-opened",
        ],
        stores: [
            "vscode-icons:folder-type-redux-store",
            "vscode-icons:folder-type-redux-store-opened",
        ],
        context: ["vscode-icons:folder-type-context", "vscode-icons:folder-type-context-opened"],
        contexts: ["vscode-icons:folder-type-context", "vscode-icons:folder-type-context-opened"],
        models: ["vscode-icons:folder-type-model", "vscode-icons:folder-type-model-opened"],
        model: ["vscode-icons:folder-type-model", "vscode-icons:folder-type-model-opened"],
        controllers: [
            "vscode-icons:folder-type-controller",
            "vscode-icons:folder-type-controller-opened",
        ],
        controller: [
            "vscode-icons:folder-type-controller",
            "vscode-icons:folder-type-controller-opened",
        ],
        tests: ["vscode-icons:folder-type-test", "vscode-icons:folder-type-test-opened"],
        test: ["vscode-icons:folder-type-test", "vscode-icons:folder-type-test-opened"],
        __tests__: ["vscode-icons:folder-type-test", "vscode-icons:folder-type-test-opened"],
        spec: ["vscode-icons:folder-type-test", "vscode-icons:folder-type-test-opened"],
        mocks: ["vscode-icons:folder-type-mock", "vscode-icons:folder-type-mock-opened"],
        __mocks__: ["vscode-icons:folder-type-mock", "vscode-icons:folder-type-mock-opened"],
        dist: ["vscode-icons:folder-type-dist", "vscode-icons:folder-type-dist-opened"],
        build: ["vscode-icons:folder-type-build", "vscode-icons:folder-type-build-opened"],
        out: ["vscode-icons:folder-type-out", "vscode-icons:folder-type-out-opened"],
        output: ["vscode-icons:folder-type-out", "vscode-icons:folder-type-out-opened"],
        ".next": ["vscode-icons:folder-type-next", "vscode-icons:folder-type-next-opened"],
        ".nuxt": ["vscode-icons:folder-type-nuxt", "vscode-icons:folder-type-nuxt-opened"],
        node_modules: ["vscode-icons:folder-type-node", "vscode-icons:folder-type-node-opened"],
        ".git": ["vscode-icons:folder-type-git", "vscode-icons:folder-type-git-opened"],
        ".github": ["vscode-icons:folder-type-github", "vscode-icons:folder-type-github-opened"],
        ".vscode": ["vscode-icons:folder-type-vscode", "vscode-icons:folder-type-vscode-opened"],
        docker: ["vscode-icons:folder-type-docker", "vscode-icons:folder-type-docker-opened"],
        scripts: ["vscode-icons:folder-type-scripts", "vscode-icons:folder-type-scripts-opened"],
        script: ["vscode-icons:folder-type-scripts", "vscode-icons:folder-type-scripts-opened"],
        docs: ["vscode-icons:folder-type-docs", "vscode-icons:folder-type-docs-opened"],
        doc: ["vscode-icons:folder-type-docs", "vscode-icons:folder-type-docs-opened"],
        database: ["vscode-icons:folder-type-db", "vscode-icons:folder-type-db-opened"],
        db: ["vscode-icons:folder-type-db", "vscode-icons:folder-type-db-opened"],
        prisma: ["vscode-icons:folder-type-prisma", "vscode-icons:folder-type-prisma-opened"],
        migrations: ["vscode-icons:folder-type-db", "vscode-icons:folder-type-db-opened"],
        seed: ["vscode-icons:folder-type-db", "vscode-icons:folder-type-db-opened"],
        graphql: ["vscode-icons:folder-type-graphql", "vscode-icons:folder-type-graphql-opened"],
        generated: ["vscode-icons:default-folder", "vscode-icons:default-folder-opened"],
        tmp: ["vscode-icons:folder-type-temp", "vscode-icons:folder-type-temp-opened"],
        temp: ["vscode-icons:folder-type-temp", "vscode-icons:folder-type-temp-opened"],
        cache: ["vscode-icons:folder-type-temp", "vscode-icons:folder-type-temp-opened"],
        logs: ["vscode-icons:folder-type-log", "vscode-icons:folder-type-log-opened"],
        log: ["vscode-icons:folder-type-log", "vscode-icons:folder-type-log-opened"],
        i18n: ["vscode-icons:folder-type-i18n", "vscode-icons:folder-type-i18n-opened"],
        locale: ["vscode-icons:folder-type-i18n", "vscode-icons:folder-type-i18n-opened"],
        locales: ["vscode-icons:folder-type-i18n", "vscode-icons:folder-type-i18n-opened"],
        lang: ["vscode-icons:folder-type-i18n", "vscode-icons:folder-type-i18n-opened"],
        languages: ["vscode-icons:folder-type-i18n", "vscode-icons:folder-type-i18n-opened"],
        themes: ["vscode-icons:folder-type-theme", "vscode-icons:folder-type-theme-opened"],
        theme: ["vscode-icons:folder-type-theme", "vscode-icons:folder-type-theme-opened"],
        plugins: ["vscode-icons:folder-type-plugin", "vscode-icons:folder-type-plugin-opened"],
        plugin: ["vscode-icons:folder-type-plugin", "vscode-icons:folder-type-plugin-opened"],
        packages: ["vscode-icons:folder-type-packages", "vscode-icons:folder-type-packages-opened"],
    };
    return map[lower] ?? ["vscode-icons:default-folder", "vscode-icons:default-folder-opened"];
}

function ReadOnlyEditor({
    filePath,
    content,
    className = "",
}: {
    filePath: string;
    content: string;
    className?: string;
}) {
    const lineWrapping = useSelector((state: RootState) => state.editor.lineWrapping);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme !== "light";

    const filename = filePath.split("/").pop() || "untitled.txt";
    const language = getLanguageExtension(filename);
    const extensions = lineWrapping
        ? language
            ? [language, EditorView.lineWrapping]
            : [EditorView.lineWrapping]
        : language
          ? [language]
          : [];

    return (
        <div className={`relative overflow-hidden ${className}`} style={{ height: "100%" }}>
            <CodeMirror
                theme={isDark ? oneDark : undefined}
                extensions={extensions}
                readOnly
                value={content ?? ""}
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

function ViewFileTreeNode({
    node,
    fileTree,
    projectId,
    onOpenFile,
}: {
    node: ViewFileNode;
    fileTree: Record<string, ViewFileNode>;
    projectId: string;
    onOpenFile: (node: ViewFileNode) => void;
}) {
    const dispatch = useDispatch<AppDispatch>();
    const [isOpen, setIsOpen] = useState(node.isExpanded);

    if (node.type === "file") {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={() => onOpenFile(node)}
                    className="data-[active=true]:bg-transparent"
                >
                    <Icon
                        icon={getFileIconId(node.name)}
                        width={16}
                        height={16}
                        className="shrink-0"
                    />
                    <span className="truncate">{node.name}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    const [closedIcon, openIcon] = getFolderIconIds(node.name);
    const childNodes = node.children
        .map((childPath) => fileTree[childPath])
        .filter(Boolean)
        .sort((a, b) => {
            if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

    return (
        <SidebarMenuItem>
            <Collapsible
                open={isOpen}
                onOpenChange={async (open) => {
                    setIsOpen(open);
                    if (open && !node.isLoaded) {
                        await dispatch(
                            accountActions.getViewFolderContent({
                                projectId,
                                folderPath: node.path,
                            })
                        );
                    }
                }}
                className="group/collapsible [&[data-state=open]>button>svg.chevron]:rotate-90"
            >
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                        <ChevronRight className="chevron shrink-0 size-4 transition-transform" />
                        <Icon
                            icon={isOpen ? openIcon : closedIcon}
                            width={16}
                            height={16}
                            className="shrink-0"
                        />
                        <span className="truncate">{node.name}</span>
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {childNodes.length > 0 ? (
                            childNodes.map((child) => (
                                <ViewFileTreeNode
                                    key={child.path}
                                    node={child}
                                    fileTree={fileTree}
                                    projectId={projectId}
                                    onOpenFile={onOpenFile}
                                />
                            ))
                        ) : node.isLoaded ? (
                            <p className="px-2 py-1 text-xs text-muted-foreground">Empty</p>
                        ) : (
                            <p className="px-2 py-1 text-xs text-muted-foreground">Loading...</p>
                        )}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenuItem>
    );
}

function ViewSidebar({
    fileTree,
    projectId,
    onOpenFile,
}: {
    fileTree: Record<string, ViewFileNode> | null;
    projectId: string;
    onOpenFile: (node: ViewFileNode) => void;
}) {
    const { resolvedTheme, setTheme } = useTheme();

    const rootNodes = useMemo(() => {
        if (!fileTree) return [];
        return Object.values(fileTree)
            .filter((node) => node.path.split("/").filter(Boolean).length === 1)
            .sort((a, b) => {
                if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
    }, [fileTree]);

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center justify-between pr-1">
                        <span>Files</span>
                    </SidebarGroupLabel>

                    <SidebarGroupContent>
                        <SidebarMenu>
                            {fileTree ? (
                                rootNodes.length > 0 ? (
                                    rootNodes.map((node) => (
                                        <ViewFileTreeNode
                                            key={node.path}
                                            node={node}
                                            fileTree={fileTree}
                                            projectId={projectId}
                                            onOpenFile={onOpenFile}
                                        />
                                    ))
                                ) : (
                                    <p className="px-2 py-1 text-xs text-muted-foreground">
                                        No files found.
                                    </p>
                                )
                            ) : (
                                <p className="px-2 py-1 text-xs text-muted-foreground">
                                    Loading files...
                                </p>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="flex items-center justify-end border-t p-2">
                <button
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    className="cursor-pointer rounded p-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    title={
                        resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
                    }
                >
                    {resolvedTheme === "dark" ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </button>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

export default function ViewProjectWorkspace({ projectId }: ViewProjectWorkspaceProps) {
    const dispatch = useDispatch<AppDispatch>();
    const viewProject = useSelector((state: RootState) => state.account.viewProject);
    const gettingFileContent = useSelector((state: RootState) => state.account.gettingFileContent);
    const lineWrapping = useSelector((state: RootState) => state.editor.lineWrapping);

    const [openTabs, setOpenTabs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const apiProjectId = useMemo(() => formatProjectId(projectId), [projectId]);
    const fileTree = viewProject?.filetree ?? null;
    const normalizedViewId = viewProject?.id ? viewProject.id.replace(/-/g, "") : "";
    const normalizedApiId = apiProjectId.replace(/-/g, "");
    const isProjectReady = Boolean(normalizedViewId && normalizedViewId === normalizedApiId);

    useEffect(() => {
        let isActive = true;

        const loadProject = async () => {
            setIsLoading(true);
            setLoadError(null);

            const result = await dispatch(
                accountActions.getViewProjectDetails({ projectId: apiProjectId })
            );

            if (!isActive) return;

            const payload = result.payload as ApiResponse | undefined;
            if (!payload?.success) {
                setLoadError(payload?.message || "Failed to load project.");
            }

            setIsLoading(false);
        };

        loadProject();

        return () => {
            isActive = false;
        };
    }, [apiProjectId, dispatch]);

    const handleOpenFile = useCallback(
        async (node: ViewFileNode) => {
            if (node.type !== "file") return;

            setOpenTabs((prev) => (prev.includes(node.path) ? prev : [...prev, node.path]));
            setActiveTab(node.path);

            if (!node.isLoaded) {
                await dispatch(
                    accountActions.getViewFileContent({
                        projectId: apiProjectId,
                        filePath: node.path,
                    })
                );
            }
        },
        [apiProjectId, dispatch]
    );

    const handleActivateTab = useCallback(
        async (filePath: string) => {
            setActiveTab(filePath);
            const node = fileTree?.[filePath];
            if (node && !node.isLoaded) {
                await dispatch(
                    accountActions.getViewFileContent({
                        projectId: apiProjectId,
                        filePath,
                    })
                );
            }
        },
        [apiProjectId, dispatch, fileTree]
    );

    const handleCloseTab = useCallback(
        (e: MouseEvent, filePath: string) => {
            e.stopPropagation();

            setOpenTabs((prevTabs) => {
                const idx = prevTabs.indexOf(filePath);
                const nextTabs = prevTabs.filter((path) => path !== filePath);

                if (activeTab === filePath) {
                    if (nextTabs.length === 0) {
                        setActiveTab(null);
                    } else {
                        setActiveTab(nextTabs[Math.max(0, idx - 1)] ?? nextTabs[0]);
                    }
                }

                return nextTabs;
            });
        },
        [activeTab]
    );

    const activeFile = activeTab && fileTree ? fileTree[activeTab] : null;
    const activeContent = activeFile?.content ?? "";
    const isActiveFileLoaded = Boolean(activeFile?.isLoaded);

    if (loadError) {
        return (
            <div className="flex h-screen items-center justify-center bg-background px-4">
                <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-gradient-to-b from-background to-background/95 p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">
                                Unable to load project
                            </h2>
                            <p className="text-sm text-muted-foreground">{loadError}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading || !isProjectReady) {
        return (
            <div className="flex h-screen items-center justify-center bg-background px-4">
                <div className="text-sm text-muted-foreground">Loading project...</div>
            </div>
        );
    }

    const projectName = viewProject?.name ?? "Project";
    const getFileName = (filePath: string) => filePath.split("/").pop() ?? filePath;

    return (
        <SidebarProvider className="h-screen overflow-hidden">
            <ViewSidebar fileTree={fileTree} projectId={apiProjectId} onOpenFile={handleOpenFile} />

            <SidebarInset className="flex flex-col overflow-hidden min-h-0 relative">
                <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1 shrink-0" />
                    <Separator
                        orientation="vertical"
                        className="data-[orientation=vertical]:h-4 shrink-0"
                    />
                    <span className="text-sm font-medium truncate shrink-0">{projectName}</span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5"
                            onClick={() => dispatch(toggleLineWrapping())}
                            title={lineWrapping ? "Disable line wrapping" : "Enable line wrapping"}
                        >
                            {lineWrapping ? (
                                <AlignLeft className="size-3.5" />
                            ) : (
                                <WrapText className="size-3.5" />
                            )}
                        </Button>
                    </div>
                </header>

                {openTabs.length > 0 && (
                    <div className="flex shrink-0 items-end overflow-x-auto border-b bg-muted/30 scrollbar-none">
                        {openTabs.map((filePath) => {
                            const isActive = filePath === activeTab;
                            return (
                                <button
                                    key={filePath}
                                    onClick={() => handleActivateTab(filePath)}
                                    className={cn(
                                        "group flex items-center gap-1.5 px-3 py-2 text-xs border-r border-border shrink-0 max-w-[180px] transition-colors",
                                        isActive
                                            ? "bg-background text-foreground border-t-2 border-t-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <FileIcon className="size-3 shrink-0" />
                                    <span className="truncate">{getFileName(filePath)}</span>
                                    <span
                                        onClick={(e) => handleCloseTab(e, filePath)}
                                        className={cn(
                                            "ml-auto rounded-sm p-0.5 transition-colors shrink-0",
                                            isActive
                                                ? "opacity-60 hover:opacity-100 hover:bg-muted"
                                                : "opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-muted"
                                        )}
                                    >
                                        <X className="size-3" />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                    {activeTab && (
                        <div className="flex items-center shrink-0 px-3 py-1 gap-0.5 text-xs text-muted-foreground border-b bg-muted/20 select-none w-full">
                            {activeTab
                                .replace(/^\//, "")
                                .split("/")
                                .map((part, i, arr) => (
                                    <Fragment key={i}>
                                        {i > 0 && (
                                            <ChevronRight className="size-3 text-muted-foreground/50 shrink-0" />
                                        )}
                                        <span
                                            className={
                                                i === arr.length - 1 ? "text-foreground/80" : ""
                                            }
                                        >
                                            {part}
                                        </span>
                                    </Fragment>
                                ))}
                        </div>
                    )}

                    <div className="flex flex-1 overflow-hidden min-h-0">
                        <div className="flex-1 overflow-hidden min-h-0 min-w-0">
                            {activeTab && activeFile ? (
                                gettingFileContent || !isActiveFileLoaded ? (
                                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                        Loading...
                                    </div>
                                ) : (
                                    <ReadOnlyEditor
                                        key={activeFile.path}
                                        className="h-full"
                                        filePath={activeFile.path}
                                        content={activeContent}
                                    />
                                )
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                    Select a file to view
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
