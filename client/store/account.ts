import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import createApiHandler from "@/utils/apiHandler";
import { ApiResponse, Payload, ViewFileNode } from "@/types/types";

export interface PublicProject {
    id: string;
    name: string;
    description?: string;
    stack: string;
    createdAt: string;
    pinned: boolean;
}

export interface viewProject {
    id: string;
    name: string;
    description?: string;
    stack: string;
    createdAt: string;
    filetree: Record<string, ViewFileNode>;
}

export interface ProfileProject extends PublicProject {
    visibility: "PUBLIC" | "PRIVATE";
    isPasswordProtected: boolean;
}

export interface PublicProfileUser {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
}

export interface PrivateProfileUser extends PublicProfileUser {
    email: string;
    twoFactorEnabled: boolean;
    signInEmailEnabled: boolean;
}

export interface PublicProfileData {
    user: PublicProfileUser;
    profileReadme: string | null;
    pinnedProjects: PublicProject[];
    projects: PublicProject[];
}

export interface PrivateProfileData {
    user: PrivateProfileUser;
    profileReadme: string | null;
    pinnedProjects: PublicProject[];
    publicProjects: PublicProject[];
    privateProjects: PublicProject[];
}

export interface SessionInfo {
    id: string;
    ip: string;
    userAgent: string | null;
    device: string;
    browser: string;
    os: string;
    city: string | null;
    region: string | null;
    country: string | null;
    lastSeen: string;
    createdAt: string;
    expiresAt: string;
    isCurrent: boolean;
}

interface AccountState {
    publicProfile: PublicProfileData | null;
    myProfile: PrivateProfileData | null;
    sessions: SessionInfo[];
    loadingPublicProfile: boolean;
    loadingMyProfile: boolean;
    loadingSessions: boolean;
    updatingSettings: boolean;
    changingPassword: boolean;
    deletingAccount: boolean;
    loggingOutSession: boolean;
    loggingOutOtherSessions: boolean;
    updatingProfileReadme: boolean;
    updatingPin: boolean;
    viewProject: viewProject | null;
    gettingFolderContent: boolean;
    gettingFileContent: boolean;
}

const accountActions = {
    fetchPublicProfile: createAsyncThunk<
        ApiResponse,
        { username: string },
        { rejectValue: ApiResponse }
    >(
        "account/fetchPublicProfile",
        createApiHandler<{ username: string }>("/api/account/public-profile", "post")
    ),

    fetchMyProfile: createAsyncThunk<ApiResponse, void, { rejectValue: ApiResponse }>(
        "account/fetchMyProfile",
        createApiHandler<void>("/api/account/my-profile", "post")
    ),

    updateSettings: createAsyncThunk<
        ApiResponse,
        { twoFactorEnabled?: boolean; signInEmailEnabled?: boolean },
        { rejectValue: ApiResponse }
    >(
        "account/updateSettings",
        createApiHandler<{ twoFactorEnabled?: boolean; signInEmailEnabled?: boolean }>(
            "/api/account/update-settings",
            "post"
        )
    ),

    changePassword: createAsyncThunk<
        ApiResponse,
        { oldPassword: string; newPassword: string },
        { rejectValue: ApiResponse }
    >(
        "account/changePassword",
        createApiHandler<{ oldPassword: string; newPassword: string }>(
            "/api/account/change-password",
            "post"
        )
    ),

    deleteAccount: createAsyncThunk<
        ApiResponse,
        { password: string },
        { rejectValue: ApiResponse }
    >(
        "account/deleteAccount",
        createApiHandler<{ password: string }>("/api/account/delete-account", "post")
    ),

    fetchSessions: createAsyncThunk<ApiResponse, void, { rejectValue: ApiResponse }>(
        "account/fetchSessions",
        createApiHandler<void>("/api/account/sessions", "post")
    ),

    logoutSession: createAsyncThunk<
        ApiResponse,
        { sessionId: string },
        { rejectValue: ApiResponse }
    >(
        "account/logoutSession",
        createApiHandler<{ sessionId: string }>("/api/account/logout-session", "post")
    ),

    logoutOtherSessions: createAsyncThunk<ApiResponse, void, { rejectValue: ApiResponse }>(
        "account/logoutOtherSessions",
        createApiHandler<void>("/api/account/logout-other-sessions", "post")
    ),

    updateProfileReadme: createAsyncThunk<
        ApiResponse,
        { content: string },
        { rejectValue: ApiResponse }
    >(
        "account/updateProfileReadme",
        createApiHandler<{ content: string }>("/api/account/profile-readme", "post")
    ),

    pinProject: createAsyncThunk<
        ApiResponse,
        { projectId: string; pinned: boolean },
        { rejectValue: ApiResponse }
    >(
        "account/pinProject",
        createApiHandler<{ projectId: string; pinned: boolean }>("/api/account/pin-project", "post")
    ),

    getViewProjectDetails: createAsyncThunk<
        ApiResponse,
        { projectId: string },
        { rejectValue: ApiResponse }
    >(
        "account/getViewProjectDetails",
        createApiHandler<{ projectId: string }>("/api/account/get-view-project", "post")
    ),

    getViewFolderContent: createAsyncThunk<
        ApiResponse,
        { projectId: string; folderPath: string },
        { rejectValue: ApiResponse }
    >(
        "account/getViewFolderContent",
        createApiHandler<{ projectId: string; folderPath: string }>(
            "/api/account/get-folder-content",
            "post"
        )
    ),

    getViewFileContent: createAsyncThunk<
        ApiResponse,
        { projectId: string; filePath: string },
        { rejectValue: ApiResponse }
    >(
        "account/getViewFileContent",
        createApiHandler<{ projectId: string; filePath: string }>(
            "/api/account/get-file-content",
            "post"
        )
    ),
};

const initialState: AccountState = {
    publicProfile: null,
    myProfile: null,
    sessions: [],
    loadingPublicProfile: false,
    loadingMyProfile: false,
    loadingSessions: false,
    updatingSettings: false,
    changingPassword: false,
    deletingAccount: false,
    loggingOutSession: false,
    loggingOutOtherSessions: false,
    updatingProfileReadme: false,
    updatingPin: false,
    viewProject: {} as viewProject,
    gettingFolderContent: false,
    gettingFileContent: false,
};

const accountSlice = createSlice({
    name: "account",
    initialState,
    reducers: {
        clearAccountState(state) {
            state.publicProfile = null;
            state.myProfile = null;
            state.sessions = [];
            state.viewProject = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(accountActions.fetchPublicProfile.pending, (state) => {
                state.loadingPublicProfile = true;
            })
            .addCase(accountActions.fetchPublicProfile.fulfilled, (state, action) => {
                state.loadingPublicProfile = false;
                const payload = action.payload as ApiResponse & { data?: PublicProfileData };
                if (payload.success && payload.data) {
                    state.publicProfile = payload.data;
                }
            })
            .addCase(accountActions.fetchPublicProfile.rejected, (state) => {
                state.loadingPublicProfile = false;
            })
            .addCase(accountActions.fetchMyProfile.pending, (state) => {
                state.loadingMyProfile = true;
            })
            .addCase(accountActions.fetchMyProfile.fulfilled, (state, action) => {
                state.loadingMyProfile = false;
                const payload = action.payload as ApiResponse & {
                    data?: PrivateProfileData & { projects?: ProfileProject[] };
                };
                if (payload.success && payload.data) {
                    const projects = payload.data.projects ?? [];
                    const publicProjects = projects.filter(
                        (project) => project.visibility === "PUBLIC"
                    );
                    const privateProjects = projects.filter(
                        (project) => project.visibility === "PRIVATE"
                    );
                    state.myProfile = {
                        ...payload.data,
                        publicProjects,
                        privateProjects,
                    };
                }
            })
            .addCase(accountActions.fetchMyProfile.rejected, (state) => {
                state.loadingMyProfile = false;
            })
            .addCase(accountActions.updateSettings.pending, (state) => {
                state.updatingSettings = true;
            })
            .addCase(accountActions.updateSettings.fulfilled, (state, action) => {
                state.updatingSettings = false;
                const payload = action.payload as ApiResponse & {
                    data?: {
                        settings?: { twoFactorEnabled: boolean; signInEmailEnabled: boolean };
                    };
                };
                if (payload.success && payload.data?.settings && state.myProfile) {
                    state.myProfile.user.twoFactorEnabled =
                        payload.data.settings.twoFactorEnabled ??
                        state.myProfile.user.twoFactorEnabled;
                    state.myProfile.user.signInEmailEnabled =
                        payload.data.settings.signInEmailEnabled ??
                        state.myProfile.user.signInEmailEnabled;
                }
            })
            .addCase(accountActions.updateSettings.rejected, (state) => {
                state.updatingSettings = false;
            })
            .addCase(accountActions.changePassword.pending, (state) => {
                state.changingPassword = true;
            })
            .addCase(accountActions.changePassword.fulfilled, (state) => {
                state.changingPassword = false;
            })
            .addCase(accountActions.changePassword.rejected, (state) => {
                state.changingPassword = false;
            })
            .addCase(accountActions.deleteAccount.pending, (state) => {
                state.deletingAccount = true;
            })
            .addCase(accountActions.deleteAccount.fulfilled, (state) => {
                state.deletingAccount = false;
            })
            .addCase(accountActions.deleteAccount.rejected, (state) => {
                state.deletingAccount = false;
            })
            .addCase(accountActions.fetchSessions.pending, (state) => {
                state.loadingSessions = true;
            })
            .addCase(accountActions.fetchSessions.fulfilled, (state, action) => {
                state.loadingSessions = false;
                const payload = action.payload as ApiResponse & {
                    data?: { sessions: SessionInfo[] };
                };
                if (payload.success && payload.data?.sessions) {
                    state.sessions = payload.data.sessions;
                }
            })
            .addCase(accountActions.fetchSessions.rejected, (state) => {
                state.loadingSessions = false;
            })
            .addCase(accountActions.logoutSession.pending, (state) => {
                state.loggingOutSession = true;
            })
            .addCase(accountActions.logoutSession.fulfilled, (state, action) => {
                state.loggingOutSession = false;
                const payload = action.payload as ApiResponse & { data?: { sessionId: string } };
                if (payload.success && payload.data?.sessionId) {
                    state.sessions = state.sessions.filter(
                        (session) => session.id !== payload.data!.sessionId
                    );
                }
            })
            .addCase(accountActions.logoutSession.rejected, (state) => {
                state.loggingOutSession = false;
            })
            .addCase(accountActions.logoutOtherSessions.pending, (state) => {
                state.loggingOutOtherSessions = true;
            })
            .addCase(accountActions.logoutOtherSessions.fulfilled, (state) => {
                state.loggingOutOtherSessions = false;
                state.sessions = state.sessions.filter((session) => session.isCurrent);
            })
            .addCase(accountActions.logoutOtherSessions.rejected, (state) => {
                state.loggingOutOtherSessions = false;
            })
            .addCase(accountActions.updateProfileReadme.pending, (state) => {
                state.updatingProfileReadme = true;
            })
            .addCase(accountActions.updateProfileReadme.fulfilled, (state, action) => {
                state.updatingProfileReadme = false;
                const payload = action.payload as ApiResponse & {
                    data?: { profileReadme: string | null };
                };
                if (payload.success && state.myProfile && payload.data) {
                    state.myProfile.profileReadme = payload.data.profileReadme ?? null;
                }
            })
            .addCase(accountActions.updateProfileReadme.rejected, (state) => {
                state.updatingProfileReadme = false;
            })
            .addCase(accountActions.pinProject.pending, (state) => {
                state.updatingPin = true;
            })
            .addCase(accountActions.pinProject.fulfilled, (state, action) => {
                state.updatingPin = false;
                const payload = action.payload as ApiResponse & {
                    data?: { project?: { id: string; pinned: boolean } };
                };
                if (payload.success && payload.data?.project && state.myProfile) {
                    const updated = payload.data.project;
                    state.myProfile.publicProjects = state.myProfile.publicProjects.map(
                        (project) =>
                            project.id === updated.id
                                ? { ...project, pinned: updated.pinned }
                                : project
                    );
                    state.myProfile.pinnedProjects = state.myProfile.publicProjects.filter(
                        (project) => project.pinned
                    );
                }
            })
            .addCase(accountActions.pinProject.rejected, (state) => {
                state.updatingPin = false;
            })
            .addCase(accountActions.getViewFolderContent.pending, (state) => {
                state.gettingFolderContent = true;
            })
            .addCase(accountActions.getViewFolderContent.fulfilled, (state, action) => {
                state.gettingFolderContent = false;
                const payload = action.payload as Payload<{
                    content: Record<string, ViewFileNode>;
                }>;
                if (payload.success && payload.data?.content !== undefined && state.viewProject) {
                    state.viewProject.filetree = {
                        ...state.viewProject.filetree,
                        ...payload.data.content,
                    };
                    if (state.viewProject.filetree) {
                        const folderPath = action.meta.arg.folderPath;
                        if (state.viewProject.filetree[folderPath]) {
                            state.viewProject.filetree[folderPath].children = Object.keys(
                                payload.data.content
                            );
                            state.viewProject.filetree[folderPath].isLoaded = true;
                        }
                    }
                }
            })
            .addCase(accountActions.getViewFolderContent.rejected, (state) => {
                state.gettingFolderContent = false;
            })
            .addCase(accountActions.getViewFileContent.pending, (state) => {
                state.gettingFileContent = true;
            })
            .addCase(accountActions.getViewFileContent.fulfilled, (state, action) => {
                state.gettingFileContent = false;
                const payload = action.payload as Payload<{ content: string }>;
                if (payload.success && state.viewProject) {
                    const filePath = action.meta.arg.filePath;
                    if (state.viewProject.filetree[filePath]) {
                        state.viewProject.filetree[filePath].content = payload.data!.content;
                        state.viewProject.filetree[filePath].isLoaded = true;
                    }
                }
            })
            .addCase(accountActions.getViewFileContent.rejected, (state) => {
                state.gettingFileContent = false;
            })
            .addCase(accountActions.getViewProjectDetails.fulfilled, (state, action) => {
                const payload = action.payload as ApiResponse & {
                    data?: { project: viewProject };
                };
                if (payload.success && payload.data?.project) {
                    state.viewProject = payload.data.project;
                }
            });
    },
});

export const { clearAccountState } = accountSlice.actions;
export { accountActions };
export default accountSlice.reducer;
