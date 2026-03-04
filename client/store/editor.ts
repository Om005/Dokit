import { ApiResponse, FileNode, Payload } from "@/types/types";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import createApiHandler from "@/utils/apiHandler";

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
};

const initialState: initialEditorState = {
    fileTree: {},
    currProject: null,
    gettingFolderContent: false,
    gettingRootContent: false,
    gettingFileContent: false,
    openTabs: [],
    activeTab: null,
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
        setFileContent(state, action: PayloadAction<{ filePath: string; content: string }>) {
            const { filePath, content } = action.payload;
            if (state.fileTree && state.fileTree[filePath]) {
                state.fileTree[filePath].code = content;
            }
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
                        state.fileTree[filePath].code = payload.data.content;
                        state.fileTree[filePath].isLoaded = true;
                    }
                }
            })
            .addCase(editorActions.getFileContent.rejected, (state) => {
                state.gettingFileContent = false;
            });
    },
});

const editorPersistConfig = {
    key: "editor",
    storage,
    whitelist: ["fileTree", "currProject", "openTabs", "activeTab"],
};

export const {
    setFileTree,
    setCurrProject,
    openTab,
    closeTab,
    setActiveTab,
    setFileContent,
    setOpenTabs,
} = editorSlice.actions;

const persistedEditorReducer = persistReducer(editorPersistConfig, editorSlice.reducer);

export { editorActions, persistedEditorReducer };
