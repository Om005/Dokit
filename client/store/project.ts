import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import createApiHandler from "@/utils/apiHandler";
import { ApiResponse } from "@/types/types";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

interface Project {
    id: string;
    name: string;
    isPasswordProtected: boolean;
    description?: string;
    stack: string;
    isArchived: boolean;
    createdAt: string;
    lastAccessedAt: string;
}

interface intialProjectState {
    projects: Project[];
    loadingProjects: boolean;
    creatingProject: boolean;
    deletingProject: boolean;
}

const projectActions = {
    fetchProjects: createAsyncThunk<ApiResponse, void, { rejectValue: ApiResponse }>(
        "project/fetchProjects",
        createApiHandler<void>("/api/project/list-projects", "get")
    ),

    createProject: createAsyncThunk<
        ApiResponse,
        { name: string; description?: string; stack: string; password?: string },
        { rejectValue: ApiResponse }
    >(
        "project/createProject",
        createApiHandler<{ name: string; description?: string; stack: string; password?: string }>(
            "/api/project/create-project",
            "post"
        )
    ),

    deleteProject: createAsyncThunk<
        ApiResponse,
        { projectId: string },
        { rejectValue: ApiResponse }
    >(
        "project/deleteProject",
        createApiHandler<{ projectId: string }>("/api/project/delete-project", "delete")
    ),
};

const initialState: intialProjectState = {
    projects: [],
    loadingProjects: false,
    creatingProject: false,
    deletingProject: false,
};

const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(projectActions.fetchProjects.pending, (state) => {
                state.loadingProjects = true;
            })

            .addCase(projectActions.fetchProjects.fulfilled, (state, action) => {
                state.loadingProjects = false;
                const payload = action.payload as ApiResponse & { data?: { projects: Project[] } };
                if (payload.success && payload.data && payload.data.projects) {
                    state.projects = payload.data.projects;
                }
            })

            .addCase(projectActions.fetchProjects.rejected, (state) => {
                state.loadingProjects = false;
            })

            .addCase(projectActions.createProject.pending, (state) => {
                state.creatingProject = true;
            })

            .addCase(projectActions.createProject.fulfilled, (state, action) => {
                state.creatingProject = false;
                const payload = action.payload as ApiResponse & { data?: { project: Project } };
                if (payload.success && payload.data && payload.data.project) {
                    state.projects.push(payload.data.project);
                }
            })

            .addCase(projectActions.createProject.rejected, (state) => {
                state.creatingProject = false;
            })

            .addCase(projectActions.deleteProject.pending, (state) => {
                state.deletingProject = true;
            })

            .addCase(projectActions.deleteProject.fulfilled, (state, action) => {
                state.deletingProject = false;
                const payload = action.payload as ApiResponse & { data?: { projectId: string } };
                if (payload.success && payload.data?.projectId) {
                    state.projects = state.projects.filter(
                        (project) => project.id !== payload.data!.projectId
                    );
                }
            })
            .addCase(projectActions.deleteProject.rejected, (state) => {
                state.deletingProject = false;
            });
    },
});

const projectPersistConfig = {
    key: "project",
    storage,
    whitelist: ["projects"],
};

const persistedProjectReducer = persistReducer(projectPersistConfig, projectSlice.reducer);

export { projectActions, persistedProjectReducer };
