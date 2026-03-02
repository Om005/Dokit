import { FileNode } from "@/types/types";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

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
    fileTree: Record<string, FileNode> | null;
    currProject: currProject | null;
}

const initialState: initialEditorState = {
    fileTree: null,
    currProject: null,
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
    },
});

const editorPersistConfig = {
    key: "editor",
    storage,
    whitelist: ["fileTree", "currProject"],
};

export const { setFileTree, setCurrProject } = editorSlice.actions;

const persistedEditorReducer = persistReducer(editorPersistConfig, editorSlice.reducer);

export { persistedEditorReducer };
