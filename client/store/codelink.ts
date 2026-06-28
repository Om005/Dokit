import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import createApiHandler from "@/utils/apiHandler";
import { ApiResponse } from "@/types/types";

export interface CodeLink {
    id: string;
    title: string;
    description: string;
    language: string;
    code?: string;
    isOwner?: boolean;
    isPasswordProtected: boolean;
    visibility: "ANYONE_WITH_LINK" | "RESTRICTED";
    allowedUserEmails?: string[];
    expiresAt: string | null;
    viewCount: number;
    createdAt: string;
}

interface CodeLinkState {
    links: CodeLink[];
    currentLink: CodeLink | null;
    loadingLinks: boolean;
    creatingLink: boolean;
    gettingLink: boolean;
    updatingLink: boolean;
    deletingLink: boolean;
    error: string | null;
}

const codelinkActions = {
    createCodeLink: createAsyncThunk<
        ApiResponse,
        {
            title: string;
            description?: string;
            language: string;
            code: string;
            isPasswordProtected?: boolean;
            visibility: "ANYONE_WITH_LINK" | "RESTRICTED";
            password?: string;
            allowedUserEmails?: string[];
            expiresAt?: string;
        },
        { rejectValue: ApiResponse }
    >(
        "codelink/createCodeLink",
        createApiHandler<{
            title: string;
            description?: string;
            language: string;
            code: string;
            isPasswordProtected?: boolean;
            visibility: "ANYONE_WITH_LINK" | "RESTRICTED";
            password?: string;
            allowedUserEmails?: string[];
            expiresAt?: string;
        }>("/api/codelink/create-codelink", "post")
    ),

    listCodeLinks: createAsyncThunk<ApiResponse, void, { rejectValue: ApiResponse }>(
        "codelink/listCodeLinks",
        createApiHandler<void>("/api/codelink/list-codelinks", "get")
    ),

    getCodeLink: createAsyncThunk<
        ApiResponse,
        { linkId: string; password?: string },
        { rejectValue: ApiResponse }
    >(
        "codelink/getCodeLink",
        createApiHandler<{ linkId: string; password?: string }>("/api/codelink/get-codelink", "get")
    ),

    deleteCodeLink: createAsyncThunk<ApiResponse, { linkId: string }, { rejectValue: ApiResponse }>(
        "codelink/deleteCodeLink",
        createApiHandler<{ linkId: string }>("/api/codelink/delete-codelink", "delete")
    ),

    updateCodeLink: createAsyncThunk<
        ApiResponse,
        {
            linkId: string;
            title?: string;
            description?: string;
            language?: string;
            code?: string;
            isPasswordProtected?: boolean;
            visibility?: "ANYONE_WITH_LINK" | "RESTRICTED";
            password?: string;
            allowedUserEmails?: string[];
            expiresAt?: string | null;
        },
        { rejectValue: ApiResponse }
    >(
        "codelink/updateCodeLink",
        createApiHandler<{
            linkId: string;
            title?: string;
            description?: string;
            language?: string;
            code?: string;
            isPasswordProtected?: boolean;
            visibility?: "ANYONE_WITH_LINK" | "RESTRICTED";
            password?: string;
            allowedUserEmails?: string[];
            expiresAt?: string | null;
        }>("/api/codelink/update-codelink", "put")
    ),
};

const initialState: CodeLinkState = {
    links: [],
    currentLink: null,
    loadingLinks: false,
    creatingLink: false,
    gettingLink: false,
    updatingLink: false,
    deletingLink: false,
    error: null,
};

const codelinkSlice = createSlice({
    name: "codelink",
    initialState,
    reducers: {
        clearCurrentLink(state) {
            state.currentLink = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(codelinkActions.createCodeLink.pending, (state) => {
                state.creatingLink = true;
                state.error = null;
            })
            .addCase(codelinkActions.createCodeLink.fulfilled, (state) => {
                state.creatingLink = false;
            })
            .addCase(codelinkActions.createCodeLink.rejected, (state, action) => {
                state.creatingLink = false;
                state.error = action.payload?.message || "Failed to create code link";
            })
            .addCase(codelinkActions.listCodeLinks.pending, (state) => {
                state.loadingLinks = true;
                state.error = null;
            })
            .addCase(codelinkActions.listCodeLinks.fulfilled, (state, action) => {
                state.loadingLinks = false;
                const payload = action.payload as ApiResponse & { data?: { links: CodeLink[] } };
                state.links = payload.data?.links || [];
            })
            .addCase(codelinkActions.listCodeLinks.rejected, (state, action) => {
                state.loadingLinks = false;
                state.error = action.payload?.message || "Failed to load code links";
            })
            .addCase(codelinkActions.getCodeLink.pending, (state) => {
                state.gettingLink = true;
                state.error = null;
            })
            .addCase(codelinkActions.getCodeLink.fulfilled, (state, action) => {
                state.gettingLink = false;
                const payload = action.payload as ApiResponse & { data?: CodeLink };
                state.currentLink = payload.data || null;
            })
            .addCase(codelinkActions.getCodeLink.rejected, (state, action) => {
                state.gettingLink = false;
                state.error = action.payload?.message || "Failed to retrieve code link";
            })
            .addCase(codelinkActions.deleteCodeLink.pending, (state) => {
                state.deletingLink = true;
                state.error = null;
            })
            .addCase(codelinkActions.deleteCodeLink.fulfilled, (state, action) => {
                state.deletingLink = false;
                state.links = state.links.filter((link) => link.id !== action.meta.arg.linkId);
            })
            .addCase(codelinkActions.deleteCodeLink.rejected, (state, action) => {
                state.deletingLink = false;
                state.error = action.payload?.message || "Failed to delete code link";
            })
            .addCase(codelinkActions.updateCodeLink.pending, (state) => {
                state.updatingLink = true;
                state.error = null;
            })
            .addCase(codelinkActions.updateCodeLink.fulfilled, (state, action) => {
                state.updatingLink = false;
                const updatedFields = action.meta.arg;
                const linkIndex = state.links.findIndex((link) => link.id === updatedFields.linkId);
                if (linkIndex !== -1) {
                    state.links[linkIndex] = {
                        ...state.links[linkIndex],
                        ...updatedFields,
                    };
                }
                if (state.currentLink && state.currentLink.id === updatedFields.linkId) {
                    state.currentLink = {
                        ...state.currentLink,
                        ...updatedFields,
                    };
                }
            })
            .addCase(codelinkActions.updateCodeLink.rejected, (state, action) => {
                state.updatingLink = false;
                state.error = action.payload?.message || "Failed to update code link";
            });
    },
});

export const { clearCurrentLink } = codelinkSlice.actions;
export { codelinkActions };
export default codelinkSlice.reducer;
