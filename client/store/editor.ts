import { ApiResponse, FileNode, Payload, TreeNode } from "@/types/types";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import createApiHandler from "@/utils/apiHandler";
import { current } from "@reduxjs/toolkit";

interface currProject {
    id: string;
    name: string;
    isPasswordProtected: boolean;
    description?: string;
    stack: string;
    isArchived: boolean;
    createdAt: string;
    lastAccessedAt: string;
}

interface initialEditorState {
    fileTree: Record<string, FileNode>;
    currProject: currProject | null;
    gettingFolderContent: boolean;
    gettingRootContent: boolean;
    gettingFileContent: boolean;
    openTabs: string[];
    activeTab: string | null;
    creatingNode: boolean;
    deletingNode: boolean;
    renamingNode: boolean;
    terminalPosition: "bottom" | "right";
    lineWrapping: boolean;
}

const editorActions = {
    getFolderContent: createAsyncThunk<
        ApiResponse,
        { projectId: string; folderPath: string },
        { rejectValue: ApiResponse }
    >(
        "editor/getFolderContent",
        createApiHandler<{ projectId: string; folderPath: string }>(
            "/api/editor/get-folder-content",
            "post"
        )
    ),
    getRootContent: createAsyncThunk<
        ApiResponse,
        { projectId: string; folderPath: string },
        { rejectValue: ApiResponse }
    >(
        "editor/getRootContent",
        createApiHandler<{ projectId: string; folderPath: string }>(
            "/api/editor/get-folder-content",
            "post"
        )
    ),
    getFileContent: createAsyncThunk<
        ApiResponse,
        { projectId: string; filePath: string },
        { rejectValue: ApiResponse }
    >(
        "editor/getFileContent",
        createApiHandler<{ projectId: string; filePath: string }>(
            "/api/editor/get-file-content",
            "post"
        )
    ),
    createNode: createAsyncThunk<
        ApiResponse,
        { projectId: string; nodePath: string; isDir: boolean },
        { rejectValue: ApiResponse }
    >(
        "editor/createNode",
        createApiHandler<{ projectId: string; nodePath: string; isDir: boolean }>(
            "/api/editor/create-node",
            "post"
        )
    ),
    deleteNode: createAsyncThunk<
        ApiResponse,
        { projectId: string; nodePath: string },
        { rejectValue: ApiResponse }
    >(
        "editor/deleteNode",
        createApiHandler<{ projectId: string; nodePath: string }>("/api/editor/delete-node", "post")
    ),
    renameNode: createAsyncThunk<
        ApiResponse,
        { projectId: string; oldPath: string; newPath: string },
        { rejectValue: ApiResponse }
    >(
        "editor/renameNode",
        createApiHandler<{ projectId: string; oldPath: string; newPath: string }>(
            "/api/editor/rename-node",
            "post"
        )
    ),
};

const initialState: initialEditorState = {
    fileTree: {},
    currProject: null,
    gettingFolderContent: false,
    gettingRootContent: false,
    gettingFileContent: false,
    openTabs: [],
    activeTab: null,
    creatingNode: false,
    deletingNode: false,
    renamingNode: false,
    terminalPosition: "bottom",
    lineWrapping: false,
};

const editorSlice = createSlice({
    name: "editor",
    initialState,
    reducers: {
        setFileTree(state, action) {
            state.fileTree = action.payload;
        },
        setCurrProject(state, action) {
            state.currProject = action.payload;
        },
        openTab(state, action: PayloadAction<string>) {
            if (!state.openTabs.includes(action.payload)) {
                state.openTabs.push(action.payload);
            }
            state.activeTab = action.payload;
        },
        setOpenTabs(state, action: PayloadAction<string[]>) {
            state.openTabs = action.payload;
        },
        closeTab(state, action: PayloadAction<string>) {
            const idx = state.openTabs.indexOf(action.payload);
            state.openTabs = state.openTabs.filter((p) => p !== action.payload);
            if (state.activeTab === action.payload) {
                if (state.openTabs.length > 0) {
                    state.activeTab = state.openTabs[Math.max(0, idx - 1)] ?? state.openTabs[0];
                } else {
                    state.activeTab = null;
                }
            }
        },
        setActiveTab(state, action: PayloadAction<string | null>) {
            state.activeTab = action.payload;
        },
        addNode(state, action: PayloadAction<{ parentPath: string; newNode: TreeNode }>) {
            const newNode: FileNode = {
                path: `${action.payload.parentPath === "/" ? "" : action.payload.parentPath}/${action.payload.newNode.name}`,
                name: action.payload.newNode.name,
                type: action.payload.newNode.isDir ? "directory" : "file",
                children: [],
                isExpanded: false,
                isLoaded: false,
            };
            if (
                action.payload.parentPath === "/" ||
                (state.fileTree[action.payload.parentPath] &&
                    state.fileTree[action.payload.parentPath].isLoaded)
            ) {
                if (action.payload.parentPath !== "/") {
                    state.fileTree[action.payload.parentPath].children.push(newNode.path);
                }
                state.fileTree[newNode.path] = newNode;
            }
        },
        deleteNode(state, action: PayloadAction<{ path: string; isDir: boolean }>) {
            const { path, isDir } = action.payload;
            if (!state.fileTree[path]) return;

            if (isDir) {
                const deleteRecursively = (nodePath: string) => {
                    const node = state.fileTree[nodePath];
                    if (node && node.type === "directory") {
                        node.children.forEach((childPath) => deleteRecursively(childPath));
                        delete state.fileTree[nodePath];
                    } else if (node) {
                        delete state.fileTree[nodePath];
                    }
                };
                deleteRecursively(path);
            } else {
                delete state.fileTree[path];
            }
        },
        renameNode(
            state,
            action: PayloadAction<{ fromPath: string; toPath: string; isDir: boolean }>
        ) {
            const { fromPath, toPath, isDir } = action.payload;

            const lastSlashIndexFrom = fromPath.lastIndexOf("/");
            const lastSlashIndexTo = toPath.lastIndexOf("/");

            const parentFrom =
                lastSlashIndexFrom === 0 ? "/" : fromPath.substring(0, lastSlashIndexFrom);
            const parentTo = lastSlashIndexTo === 0 ? "/" : toPath.substring(0, lastSlashIndexTo);

            if (fromPath === toPath) return;

            // Node doesn't exist AND new parent isn't loaded/doesn't exist. Ignore it.
            if (
                !state.fileTree[fromPath] &&
                parentTo !== "/" &&
                (!state.fileTree[parentTo] || !state.fileTree[parentTo].isLoaded)
            ) {
                return;
            }

            // Node doesn't exist but new parent is loaded (or is root). Create it.
            if (
                !state.fileTree[fromPath] &&
                (parentTo === "/" ||
                    (state.fileTree[parentTo] && state.fileTree[parentTo].isLoaded))
            ) {
                const newNode: FileNode = {
                    path: toPath,
                    name: toPath.substring(toPath.lastIndexOf("/") + 1),
                    type: isDir ? "directory" : "file",
                    children: [],
                    isExpanded: false,
                    isLoaded: false,
                };

                state.fileTree[toPath] = newNode;

                if (parentTo !== "/") {
                    state.fileTree[parentTo].children.push(toPath);
                }
                return;
            }

            // Node exists and needs to be renamed/moved.
            else if (state.fileTree[fromPath]) {
                // Remove from the old parent's children array
                if (parentFrom !== "/" && state.fileTree[parentFrom]) {
                    state.fileTree[parentFrom].children = state.fileTree[
                        parentFrom
                    ].children.filter((childPath) => childPath !== fromPath);
                }

                // Add to the new parent's children array (if the new parent is loaded)
                if (
                    parentTo !== "/" &&
                    state.fileTree[parentTo] &&
                    state.fileTree[parentTo].isLoaded
                ) {
                    if (!state.fileTree[parentTo].children.includes(toPath)) {
                        state.fileTree[parentTo].children.push(toPath);
                    }
                }

                const renameRecursively = (oldPath: string, newPath: string) => {
                    const node = state.fileTree[oldPath];
                    if (!node) return;

                    node.path = newPath;
                    node.name = newPath.substring(newPath.lastIndexOf("/") + 1);

                    state.fileTree[newPath] = node;
                    delete state.fileTree[oldPath];

                    if (node.type === "directory") {
                        const newChildren: string[] = [];

                        node.children.forEach((childOldPath) => {
                            const childNewPath = newPath + childOldPath.substring(oldPath.length);

                            renameRecursively(childOldPath, childNewPath);
                            newChildren.push(childNewPath);
                        });

                        node.children = newChildren;
                    }
                };

                renameRecursively(fromPath, toPath);
            }
            state.openTabs.forEach((openPath) => {
                if (openPath === fromPath || openPath.startsWith(fromPath + "/")) {
                    const newOpenPath = toPath + openPath.substring(fromPath.length);
                    const idx = state.openTabs.indexOf(openPath);
                    state.openTabs[idx] = newOpenPath;

                    if (state.activeTab === openPath) {
                        state.activeTab = newOpenPath;
                    }
                }
            });
        },
        toggleTerminalPosition(state) {
            state.terminalPosition = state.terminalPosition === "bottom" ? "right" : "bottom";
        },
        toggleLineWrapping(state) {
            state.lineWrapping = !state.lineWrapping;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(editorActions.getFolderContent.pending, (state) => {
                state.gettingFolderContent = true;
            })
            .addCase(editorActions.getFolderContent.fulfilled, (state, action) => {
                state.gettingFolderContent = false;
                const payload = action.payload as Payload<{ content: Record<string, FileNode> }>;
                if (payload.success && payload.data?.content) {
                    state.fileTree = { ...state.fileTree, ...payload.data.content };
                    if (state.fileTree) {
                        const folderPath = action.meta.arg.folderPath;
                        if (state.fileTree[folderPath]) {
                            state.fileTree[folderPath].children = Object.keys(payload.data.content);
                            state.fileTree[folderPath].isLoaded = true;
                        }
                    }
                }
            })
            .addCase(editorActions.getFolderContent.rejected, (state) => {
                state.gettingFolderContent = false;
            })
            .addCase(editorActions.getRootContent.pending, (state) => {
                state.gettingRootContent = true;
            })
            .addCase(editorActions.getRootContent.fulfilled, (state, action) => {
                state.gettingRootContent = false;
                const payload = action.payload as Payload<{ content: Record<string, FileNode> }>;
                if (payload.success && payload.data?.content) {
                    state.fileTree = payload.data.content;
                }
            })
            .addCase(editorActions.getRootContent.rejected, (state) => {
                state.gettingRootContent = false;
            })
            .addCase(editorActions.getFileContent.pending, (state, action) => {
                state.gettingFileContent = true;
                const filePath = action.meta.arg.filePath;
                if (!state.openTabs.includes(filePath)) {
                    state.openTabs.push(filePath);
                }
                state.activeTab = filePath;
            })
            .addCase(editorActions.getFileContent.fulfilled, (state, action) => {
                state.gettingFileContent = false;
                const payload = action.payload as Payload<{ content: string }>;
                if (payload.success && payload.data?.content !== undefined) {
                    const filePath = action.meta.arg.filePath;
                    if (state.fileTree && state.fileTree[filePath]) {
                        state.fileTree[filePath].isLoaded = true;
                    }
                }
            })
            .addCase(editorActions.getFileContent.rejected, (state) => {
                state.gettingFileContent = false;
            })

            .addCase(editorActions.createNode.pending, (state) => {
                state.creatingNode = true;
            })
            .addCase(editorActions.createNode.fulfilled, (state) => {
                state.creatingNode = false;
            })
            .addCase(editorActions.createNode.rejected, (state) => {
                state.creatingNode = false;
            })
            .addCase(editorActions.deleteNode.pending, (state) => {
                state.deletingNode = true;
            })
            .addCase(editorActions.deleteNode.fulfilled, (state, action) => {
                state.deletingNode = false;
                const { nodePath } = action.meta.arg;

                if (state.openTabs.some((p) => p === nodePath || p.startsWith(nodePath + "/"))) {
                    const removedTabs = state.openTabs.filter(
                        (p) => p === nodePath || p.startsWith(nodePath + "/")
                    );

                    state.openTabs = state.openTabs.filter(
                        (p) => !(p === nodePath || p.startsWith(nodePath + "/"))
                    );

                    if (state.activeTab && removedTabs.includes(state.activeTab)) {
                        if (state.openTabs.length > 0) {
                            state.activeTab = state.openTabs[state.openTabs.length - 1];
                        } else {
                            state.activeTab = null;
                        }
                    }
                }
            })
            .addCase(editorActions.deleteNode.rejected, (state) => {
                state.deletingNode = false;
            })
            .addCase(editorActions.renameNode.pending, (state) => {
                state.renamingNode = true;
            })
            .addCase(editorActions.renameNode.fulfilled, (state) => {
                state.renamingNode = false;
            })
            .addCase(editorActions.renameNode.rejected, (state) => {
                state.renamingNode = false;
            });
    },
});

const editorPersistConfig = {
    key: "editor",
    storage,
    whitelist: [
        "fileTree",
        "currProject",
        "openTabs",
        "activeTab",
        "terminalPosition",
        "lineWrapping",
    ],
};

export const {
    setFileTree,
    setCurrProject,
    openTab,
    closeTab,
    setActiveTab,
    setOpenTabs,
    addNode,
    deleteNode,
    renameNode,
    toggleTerminalPosition,
    toggleLineWrapping,
} = editorSlice.actions;

const persistedEditorReducer = persistReducer(editorPersistConfig, editorSlice.reducer);

export { editorActions, persistedEditorReducer };
