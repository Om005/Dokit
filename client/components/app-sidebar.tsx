"use client";

import * as React from "react";
import { ChevronRight, FilePlus, FolderPlus } from "lucide-react";
import { Icon } from "@iconify/react";
import { useDispatch, useSelector } from "react-redux";

import { RootState, AppDispatch } from "@/store/store";
import { FileNode, Payload, TreeNode } from "@/types/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarRail,
} from "@/components/ui/sidebar";
import { addNode, deleteNode, editorActions, openTab, setActiveTab } from "@/store/editor";
import useFileTreeSocket from "@/hooks/use-filetree-socket";
import { FileNodeContextMenu } from "@/components/file-node-context-menu";
import { NodeActionDialog } from "@/components/node-action-dialog";
import { toast } from "sonner";

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
        "readme.md": "vscode-icons:file-type-readme",
        readme: "vscode-icons:file-type-readme",
        license: "vscode-icons:file-type-license",
        licence: "vscode-icons:file-type-license",
        "changelog.md": "vscode-icons:file-type-changelog",
        ".editorconfig": "vscode-icons:file-type-editorconfig",
        ".env": "vscode-icons:file-type-env",
        ".env.local": "vscode-icons:file-type-env",
        ".env.example": "vscode-icons:file-type-env",
        ".env.development": "vscode-icons:file-type-env",
        ".env.production": "vscode-icons:file-type-env",
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
    if (lower.startsWith(".env")) return "vscode-icons:file-type-env";
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
        csv: "vscode-icons:file-type-csv",
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
        assets: ["vscode-icons:folder-type-assets", "vscode-icons:folder-type-assets-opened"],
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
            "vscode-icons:folder-type-components",
            "vscode-icons:folder-type-components-opened",
        ],
        component: [
            "vscode-icons:folder-type-components",
            "vscode-icons:folder-type-components-opened",
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
        generated: [
            "vscode-icons:folder-type-generated",
            "vscode-icons:folder-type-generated-opened",
        ],
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const dispatch = useDispatch<AppDispatch>();
    const fileTree = useSelector((state: RootState) => state.editor.fileTree);
    const projectId = useSelector((state: RootState) => state.editor.currProject?.id);
    const creatingNode = useSelector((state: RootState) => state.editor.creatingNode);
    const [rootDialogOpen, setRootDialogOpen] = React.useState(false);
    const [rootDialogNodeType, setRootDialogNodeType] = React.useState<"file" | "folder">("file");

    const handleRootCreate = async (value?: string) => {
        if (!projectId || !value) return;
        try {
            const response = await dispatch(
                editorActions.createNode({
                    projectId,
                    nodePath: `/${value}`,
                    isDir: rootDialogNodeType === "folder",
                })
            );
            const payload = response.payload as Payload<void>;
            if (!payload.success) {
                toast.error(payload.message || "An error occurred. Please try again.");
                return;
            }
            setRootDialogOpen(false);
        } catch (error) {
            console.error("Error creating root node:", error);
        }
    };

    const rootNodes = React.useMemo(() => {
        if (!fileTree) return [];
        return Object.values(fileTree)
            .filter((node) => node.path.split("/").filter(Boolean).length === 1)
            .sort((a, b) => {
                if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
    }, [fileTree]);

    return (
        <Sidebar {...props}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center justify-between pr-1">
                        <span>Files</span>
                        <div className="flex items-center gap-0.5">
                            <button
                                title="New File"
                                className="cursor-pointer rounded p-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                                onClick={() => {
                                    setRootDialogNodeType("file");
                                    setRootDialogOpen(true);
                                }}
                            >
                                <FilePlus className="h-3.5 w-3.5" />
                            </button>
                            <button
                                title="New Folder"
                                className="cursor-pointer rounded p-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                                onClick={() => {
                                    setRootDialogNodeType("folder");
                                    setRootDialogOpen(true);
                                }}
                            >
                                <FolderPlus className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </SidebarGroupLabel>

                    <SidebarGroupContent>
                        <SidebarMenu>
                            {fileTree ? (
                                rootNodes.length > 0 ? (
                                    rootNodes.map((node) => (
                                        <FileTreeNode
                                            key={node.path}
                                            node={node}
                                            fileTree={fileTree}
                                        />
                                    ))
                                ) : (
                                    <p className="px-2 py-1 text-xs text-muted-foreground">
                                        No files found.
                                    </p>
                                )
                            ) : (
                                <p className="px-2 py-1 text-xs text-muted-foreground">
                                    Loading files…
                                </p>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
            <NodeActionDialog
                open={rootDialogOpen}
                action="create"
                nodeType={rootDialogNodeType}
                isLoading={creatingNode}
                onOpenChange={setRootDialogOpen}
                onConfirm={handleRootCreate}
            />
        </Sidebar>
    );
}

function FileTreeNode({ node, fileTree }: { node: FileNode; fileTree: Record<string, FileNode> }) {
    const dispatch = useDispatch<AppDispatch>();
    const projectId = useSelector((state: RootState) => state.editor.currProject?.id);
    const creatingNode = useSelector((state: RootState) => state.editor.creatingNode);
    const deletingNode = useSelector((state: RootState) => state.editor.deletingNode);
    const renamingNode = useSelector((state: RootState) => state.editor.renamingNode);

    const [isOpen, setIsOpen] = React.useState(node.isExpanded);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [dialogAction, setDialogAction] = React.useState<"create" | "rename" | "delete" | null>(
        null
    );
    const [dialogNodeType, setDialogNodeType] = React.useState<"file" | "folder">("file");

    const isLoading =
        dialogAction === "create"
            ? creatingNode
            : dialogAction === "delete"
              ? deletingNode
              : dialogAction === "rename"
                ? renamingNode
                : false;

    const openDialog = (action: "create" | "rename" | "delete", nodeType: "file" | "folder") => {
        setDialogAction(action);
        setDialogNodeType(nodeType);
        setDialogOpen(true);
    };

    const handleConfirm = async (value?: string) => {
        if (!projectId) return;
        try {
            let response;
            if (dialogAction === "create" && value) {
                response = await dispatch(
                    editorActions.createNode({
                        projectId,
                        nodePath: `${node.path}/${value}`,
                        isDir: dialogNodeType === "folder",
                    })
                );
            } else if (dialogAction === "delete") {
                response = await dispatch(
                    editorActions.deleteNode({
                        projectId,
                        nodePath: node.path,
                    })
                );
            } else if (dialogAction === "rename" && value) {
                const lastSlash = node.path.lastIndexOf("/");
                const parentPath = lastSlash > 0 ? node.path.substring(0, lastSlash) : "";
                response = await dispatch(
                    editorActions.renameNode({
                        projectId,
                        oldPath: node.path,
                        newPath: `${parentPath}/${value}`,
                    })
                );
            }
            const payload = response!.payload as Payload<void>;
            if (!payload.success) {
                toast.error(payload.message || "An error occurred. Please try again.");
                return;
            }
            setDialogOpen(false);
        } catch (error) {
            console.error("Error occurred while handling dialog confirmation:", error);
        }
    };

    const [closedIcon, openIcon] = getFolderIconIds(node.name);

    const dialog = (
        <NodeActionDialog
            open={dialogOpen}
            action={dialogAction}
            nodeType={dialogNodeType}
            nodeName={node.name}
            initialValue={dialogAction === "rename" ? node.name : undefined}
            isLoading={isLoading}
            onOpenChange={setDialogOpen}
            onConfirm={handleConfirm}
        />
    );

    if (node.type === "file") {
        return (
            <>
                <SidebarMenuItem>
                    <FileNodeContextMenu
                        node={node}
                        onRename={() => openDialog("rename", "file")}
                        onDelete={() => openDialog("delete", "file")}
                    >
                        <SidebarMenuButton
                            onClick={async () => {
                                try {
                                    await dispatch(openTab(node.path));
                                    await dispatch(setActiveTab(node.path));
                                } catch (error) {
                                    console.error("Failed to load file content:", error);
                                }
                            }}
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
                    </FileNodeContextMenu>
                </SidebarMenuItem>
                {dialog}
            </>
        );
    }

    const childNodes = node.children
        .map((childPath) => fileTree[childPath])
        .filter(Boolean)
        .sort((a, b) => {
            if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

    return (
        <>
            <SidebarMenuItem>
                <Collapsible
                    open={isOpen}
                    onOpenChange={async () => {
                        setIsOpen(!isOpen);
                        if (node.type === "directory" && !node.isLoaded) {
                            await dispatch(
                                editorActions.getFolderContent({
                                    projectId: projectId!,
                                    folderPath: node.path,
                                })
                            );
                        }
                    }}
                    className="group/collapsible [&[data-state=open]>button>svg.chevron]:rotate-90"
                >
                    <FileNodeContextMenu
                        node={node}
                        onNewFile={() => openDialog("create", "file")}
                        onNewFolder={() => openDialog("create", "folder")}
                        onRename={() => openDialog("rename", "folder")}
                        onDelete={() => openDialog("delete", "folder")}
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
                    </FileNodeContextMenu>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {childNodes.length > 0 ? (
                                childNodes.map((child) => (
                                    <FileTreeNode
                                        key={child.path}
                                        node={child}
                                        fileTree={fileTree}
                                    />
                                ))
                            ) : node.isLoaded ? (
                                <p className="px-2 py-1 text-xs text-muted-foreground">Empty</p>
                            ) : (
                                <p className="px-2 py-1 text-xs text-muted-foreground">Loading…</p>
                            )}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
            </SidebarMenuItem>
            {dialog}
        </>
    );
}
