import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import createApiHandler from "@/utils/apiHandler";
import { ApiResponse } from "@/types/types";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { Project } from "@/types/types";

interface intialProjectState {
    projects: Project[];
    loadingProjects: boolean;
    creatingProject: boolean;
    deletingProject: boolean;
    startingProject: boolean;
    changingSettings: boolean;
    gettingProjectDetails: boolean;
    pendingPassword: string | null;
    lastProject: string | null;
    closingProject: boolean;
    requestingAccess: boolean;
    reviewingRequest: boolean;
    gettingPendingRequests: boolean;
    pendingRequests: { id: string; userId: string; username: string }[] | null;
    invitingMember: boolean;
    changingMemberAccess: boolean;
    removingMember: boolean;
}

const projectActions = {
    fetchProjects: createAsyncThunk<ApiResponse, void, { rejectValue: ApiResponse }>(
        "project/fetchProjects",
        createApiHandler<void>("/api/project/list-projects", "get")
    ),

    getProjectDetails: createAsyncThunk<
        ApiResponse,
        { projectId: string },
        { rejectValue: ApiResponse }
    >(
        "project/getProjectDetails",
        createApiHandler<{ projectId: string }>("/api/project/project-details", "get")
    ),

    createProject: createAsyncThunk<
        ApiResponse,
        {
            name: string;
            description?: string;
            stack: string;
            password?: string;
            visibility: "PUBLIC" | "PRIVATE";
        },
        { rejectValue: ApiResponse }
    >(
        "project/createProject",
        createApiHandler<{
            name: string;
            description?: string;
            stack: string;
            password?: string;
            visibility: "PUBLIC" | "PRIVATE";
        }>("/api/project/create-project", "post")
    ),

    deleteProject: createAsyncThunk<
        ApiResponse,
        { projectId: string; accountPassword: string },
        { rejectValue: ApiResponse }
    >(
        "project/deleteProject",
        createApiHandler<{ projectId: string; accountPassword: string }>(
            "/api/project/delete-project",
            "post"
        )
    ),

    startProject: createAsyncThunk<
        ApiResponse,
        { projectId: string; password?: string },
        { rejectValue: ApiResponse }
    >(
        "project/startProject",
        createApiHandler<{ projectId: string; password?: string }>(
            "/api/project/start-project",
            "post"
        )
    ),

    changeProjectSettings: createAsyncThunk<
        ApiResponse,
        {
            projectId: string;
            newName: string;
            description: string;
            isPasswordProtected: boolean;
            visibility: "PUBLIC" | "PRIVATE";
            password?: string;
            accountPassword: string;
        },
        { rejectValue: ApiResponse }
    >(
        "project/changeProjectSettings",
        createApiHandler<{
            projectId: string;
            newName: string;
            description?: string;
            isPasswordProtected: boolean;
            visibility: "PUBLIC" | "PRIVATE";
            password?: string;
            accountPassword: string;
        }>("/api/project/change-settings", "post")
    ),
    closeProject: createAsyncThunk<
        ApiResponse,
        { projectId: string },
        { rejectValue: ApiResponse }
    >(
        "project/closeProject",
        createApiHandler<{ projectId: string }>("/api/project/close-project", "post")
    ),
    requestProjectAccess: createAsyncThunk<
        ApiResponse,
        { projectId: string },
        { rejectValue: ApiResponse }
    >(
        "project/requestProjectAccess",
        createApiHandler<{ projectId: string }>("/api/project/access/request-access", "post")
    ),
    reviewRequest: createAsyncThunk<
        ApiResponse,
        { requestId: string; status: "APPROVED" | "REJECTED" },
        { rejectValue: ApiResponse }
    >(
        "project/reviewRequest",
        createApiHandler<{ requestId: string; status: "APPROVED" | "REJECTED" }>(
            "/api/project/access/review-request",
            "post"
        )
    ),
    getPendingAccessRequests: createAsyncThunk<
        ApiResponse,
        { projectId: string },
        { rejectValue: ApiResponse }
    >(
        "project/getPendingAccessRequests",
        createApiHandler<{ projectId: string }>("/api/project/access/get-pending-requests", "post")
    ),
    inviteMemeber: createAsyncThunk<
        ApiResponse,
        { projectId: string; email: string; accessLevel: "READ" | "WRITE" },
        { rejectValue: ApiResponse }
    >(
        "project/inviteMemeber",
        createApiHandler<{ projectId: string; email: string; accessLevel: "READ" | "WRITE" }>(
            "/api/project/access/invite-member",
            "post"
        )
    ),
    changeMemberAccess: createAsyncThunk<
        ApiResponse,
        { projectId: string; userId: string; newAccessLevel: "READ" | "WRITE" },
        { rejectValue: ApiResponse }
    >(
        "project/changeMemberAccess",
        createApiHandler<{ projectId: string; userId: string; newAccessLevel: "READ" | "WRITE" }>(
            "/api/project/access/change-member-access",
            "post"
        )
    ),
    removeMember: createAsyncThunk<
        ApiResponse,
        { projectId: string; userId: string },
        { rejectValue: ApiResponse }
    >(
        "project/removeMember",
        createApiHandler<{ projectId: string; userId: string }>(
            "/api/project/access/remove-member",
            "post"
        )
    ),
};

const initialState: intialProjectState = {
    projects: [],
    loadingProjects: false,
    creatingProject: false,
    deletingProject: false,
    startingProject: false,
    changingSettings: false,
    gettingProjectDetails: false,
    pendingPassword: null,
    lastProject: null,
    closingProject: false,
    requestingAccess: false,
    reviewingRequest: false,
    gettingPendingRequests: false,
    pendingRequests: null,
    invitingMember: false,
    changingMemberAccess: false,
    removingMember: false,
};

const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {
        setPendingPassword(state, action) {
            state.pendingPassword = action.payload;
        },
        setLastProject(state, action) {
            state.lastProject = action.payload;
        },
    },
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
            })

            .addCase(projectActions.startProject.pending, (state) => {
                state.startingProject = true;
            })

            .addCase(projectActions.startProject.fulfilled, (state) => {
                state.startingProject = false;
            })

            .addCase(projectActions.startProject.rejected, (state) => {
                state.startingProject = false;
            })

            .addCase(projectActions.changeProjectSettings.pending, (state) => {
                state.changingSettings = true;
            })

            .addCase(projectActions.changeProjectSettings.fulfilled, (state, action) => {
                const payload = action.payload as ApiResponse & { data?: { project: Project } };
                if (payload.success && payload.data && payload.data.project) {
                    const updatedProject = payload.data.project;
                    state.projects = state.projects.map((project) =>
                        project.id === updatedProject.id ? updatedProject : project
                    );
                }
                state.changingSettings = false;
            })

            .addCase(projectActions.changeProjectSettings.rejected, (state) => {
                state.changingSettings = false;
            })

            .addCase(projectActions.getProjectDetails.pending, (state) => {
                state.gettingProjectDetails = true;
            })

            .addCase(projectActions.getProjectDetails.fulfilled, (state, action) => {
                state.gettingProjectDetails = false;
                const payload = action.payload as ApiResponse & { data?: { project: Project } };
                if (payload.success && payload.data && payload.data.project) {
                    const updatedProject = payload.data.project;
                    state.projects = state.projects.map((project) =>
                        project.id === updatedProject.id ? updatedProject : project
                    );
                }
            })

            .addCase(projectActions.getProjectDetails.rejected, (state) => {
                state.gettingProjectDetails = false;
            })
            .addCase(projectActions.closeProject.pending, (state) => {
                state.closingProject = true;
            })

            .addCase(projectActions.closeProject.fulfilled, (state) => {
                state.closingProject = false;
            })
            .addCase(projectActions.closeProject.rejected, (state) => {
                state.closingProject = false;
            })
            .addCase(projectActions.requestProjectAccess.pending, (state) => {
                state.requestingAccess = true;
            })
            .addCase(projectActions.requestProjectAccess.fulfilled, (state) => {
                state.requestingAccess = false;
            })
            .addCase(projectActions.requestProjectAccess.rejected, (state) => {
                state.requestingAccess = false;
            })
            .addCase(projectActions.reviewRequest.pending, (state) => {
                state.reviewingRequest = true;
            })
            .addCase(projectActions.reviewRequest.fulfilled, (state, action) => {
                state.reviewingRequest = false;
                state.pendingRequests =
                    state.pendingRequests?.filter(
                        (request) => request.id !== action.meta.arg.requestId
                    ) || null;
            })
            .addCase(projectActions.reviewRequest.rejected, (state) => {
                state.reviewingRequest = false;
            })
            .addCase(projectActions.getPendingAccessRequests.pending, (state) => {
                state.gettingPendingRequests = true;
            })
            .addCase(projectActions.getPendingAccessRequests.fulfilled, (state, action) => {
                state.gettingPendingRequests = false;
                const payload = action.payload as ApiResponse & {
                    data?: { requests: { id: string; userId: string; username: string }[] };
                };
                if (payload.success && payload.data && payload.data.requests) {
                    state.pendingRequests = payload.data.requests;
                }
            })
            .addCase(projectActions.getPendingAccessRequests.rejected, (state) => {
                state.gettingPendingRequests = false;
            })
            .addCase(projectActions.inviteMemeber.pending, (state) => {
                state.invitingMember = true;
            })
            .addCase(projectActions.inviteMemeber.fulfilled, (state) => {
                state.invitingMember = false;
            })
            .addCase(projectActions.inviteMemeber.rejected, (state) => {
                state.invitingMember = false;
            })
            .addCase(projectActions.changeMemberAccess.pending, (state) => {
                state.changingMemberAccess = true;
            })
            .addCase(projectActions.changeMemberAccess.fulfilled, (state) => {
                state.changingMemberAccess = false;
            })
            .addCase(projectActions.changeMemberAccess.rejected, (state) => {
                state.changingMemberAccess = false;
            })
            .addCase(projectActions.removeMember.pending, (state) => {
                state.removingMember = true;
            })
            .addCase(projectActions.removeMember.fulfilled, (state) => {
                state.removingMember = false;
            })
            .addCase(projectActions.removeMember.rejected, (state) => {
                state.removingMember = false;
            });
    },
});

const projectPersistConfig = {
    key: "project",
    storage,
    whitelist: ["projects", "lastProject"],
};

const persistedProjectReducer = persistReducer(projectPersistConfig, projectSlice.reducer);

export const { setPendingPassword, setLastProject } = projectSlice.actions;
export { projectActions, persistedProjectReducer };
