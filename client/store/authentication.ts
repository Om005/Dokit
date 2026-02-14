import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ApiResponse } from "@/types/types";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import createApiHandler from "@/utils/apiHandler";

interface AuthState {
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    id: string | null;
    accountCreationEmail: string | null;
    verifiedForAccountCreation: boolean;
    verifiedForPasswordReset: boolean;
    passwordResetEmail: string | null;
    isLoading: boolean;
    usernameAvailability: {
        loading: boolean;
        available: boolean | null;
    };
}

const authActions = {
    sendOtpForAccountCreation: createAsyncThunk<
        ApiResponse,
        { email: string },
        { rejectValue: ApiResponse }
    >(
        "auth/sendOtpForAccountCreation",
        createApiHandler<{ email: string }>("/api/auth/send-otp-to-create-account")
    ),

    verifyAccountCreationOtp: createAsyncThunk<
        ApiResponse,
        { email: string; otp: string },
        { rejectValue: ApiResponse }
    >(
        "auth/verifyAccountCreationOtp",
        createApiHandler<{ email: string; otp: string }>("/api/auth/verify-account-creation-otp")
    ),

    createAccount: createAsyncThunk<
        ApiResponse,
        { email: string; firstName: string; lastName: string; username: string; password: string },
        { rejectValue: ApiResponse }
    >(
        "auth/createAccount",
        createApiHandler<{
            email: string;
            firstName: string;
            lastName: string;
            username: string;
            password: string;
        }>("/api/auth/create-account")
    ),

    signIn: createAsyncThunk<
        ApiResponse,
        { email: string; password: string },
        { rejectValue: ApiResponse }
    >("auth/signIn", createApiHandler<{ email: string; password: string }>("/api/auth/sign-in")),

    signOut: createAsyncThunk<ApiResponse, void, { rejectValue: ApiResponse }>(
        "auth/signOut",
        createApiHandler<void>("/api/auth/sign-out")
    ),

    refreshSession: createAsyncThunk<ApiResponse, void, { rejectValue: ApiResponse }>(
        "auth/refreshSession",
        createApiHandler<void>("/api/auth/refresh-session")
    ),

    sendOtpForPasswordReset: createAsyncThunk<
        ApiResponse,
        { email: string },
        { rejectValue: ApiResponse }
    >(
        "auth/sendOtpForPasswordReset",
        createApiHandler<{ email: string }>("/api/auth/send-otp-for-password-reset")
    ),

    verifyPasswordResetOtp: createAsyncThunk<
        ApiResponse,
        { email: string; otp: string },
        { rejectValue: ApiResponse }
    >(
        "auth/verifyPasswordResetOtp",
        createApiHandler<{ email: string; otp: string }>("/api/auth/verify-password-reset-otp")
    ),

    resetPassword: createAsyncThunk<
        ApiResponse,
        { email: string; newPassword: string },
        { rejectValue: ApiResponse }
    >(
        "auth/resetPassword",
        createApiHandler<{ email: string; newPassword: string }>("/api/auth/reset-password")
    ),

    isAuthenticated: createAsyncThunk<ApiResponse, void, { rejectValue: ApiResponse }>(
        "auth/isAuthenticated",
        createApiHandler<void>("/api/auth/is-authenticated")
    ),

    isUsernameAvailable: createAsyncThunk<
        ApiResponse,
        { username: string },
        { rejectValue: ApiResponse }
    >(
        "auth/isUsernameAvailable",
        createApiHandler<{ username: string }>("/api/auth/is-username-available")
    ),
};

const initialState: AuthState = {
    isAuthenticated: false,
    isAuthLoading: true,
    email: null,
    firstName: null,
    lastName: null,
    username: null,
    id: null,
    accountCreationEmail: null,
    passwordResetEmail: null,
    verifiedForAccountCreation: false,
    verifiedForPasswordReset: false,
    isLoading: false,
    usernameAvailability: {
        loading: false,
        available: null,
    },
};

const authSlice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers: {
        setAccountCreationEmail(state, action) {
            state.accountCreationEmail = action.payload;
        },
        setPasswordResetEmail(state, action) {
            state.passwordResetEmail = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(authActions.sendOtpForAccountCreation.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(authActions.sendOtpForAccountCreation.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(authActions.sendOtpForAccountCreation.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(authActions.verifyAccountCreationOtp.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(authActions.verifyAccountCreationOtp.fulfilled, (state) => {
                state.isLoading = false;
                state.verifiedForAccountCreation = true;
            })
            .addCase(authActions.verifyAccountCreationOtp.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(authActions.createAccount.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(authActions.createAccount.fulfilled, (state, action) => {
                state.isLoading = false;
                state.accountCreationEmail = null;
                state.passwordResetEmail = null;
                state.verifiedForAccountCreation = false;
                const payload = action.payload as ApiResponse & {
                    data?: {
                        user?: {
                            email?: string;
                            firstName?: string;
                            lastName?: string;
                            username?: string;
                            id?: string;
                        };
                    };
                };
                if (payload && payload.data && payload.data.user && payload.data.user.email) {
                    state.isAuthenticated = true;
                    state.email = payload.data.user.email || null;
                    state.firstName = payload.data.user.firstName || null;
                    state.lastName = payload.data.user.lastName || null;
                    state.username = payload.data.user.username || null;
                    state.id = payload.data.user.id || null;
                }
            })
            .addCase(authActions.createAccount.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(authActions.signIn.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(authActions.signIn.fulfilled, (state, action) => {
                state.isLoading = false;
                state.accountCreationEmail = null;
                state.passwordResetEmail = null;
                const payload = action.payload as ApiResponse & {
                    data?: {
                        user?: {
                            email?: string;
                            firstName?: string;
                            lastName?: string;
                            username?: string;
                            id?: string;
                        };
                    };
                };
                if (payload && payload.data && payload.data.user && payload.data.user.email) {
                    state.isAuthenticated = true;
                    state.email = payload.data.user.email || null;
                    state.firstName = payload.data.user.firstName || null;
                    state.lastName = payload.data.user.lastName || null;
                    state.username = payload.data.user.username || null;
                    state.id = payload.data.user.id || null;
                }
            })
            .addCase(authActions.signIn.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(authActions.signOut.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(authActions.signOut.fulfilled, (state) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.email = null;
                state.firstName = null;
                state.lastName = null;
                state.username = null;
                state.id = null;
            })
            .addCase(authActions.signOut.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(authActions.refreshSession.fulfilled, (state, action) => {
                const payload = action.payload as ApiResponse & {
                    data?: {
                        user?: {
                            email?: string;
                            firstName?: string;
                            lastName?: string;
                            username?: string;
                            id?: string;
                        };
                    };
                };
                if (payload && payload.data && payload.data.user && payload.data.user.email) {
                    state.isAuthenticated = true;
                    state.email = payload.data.user.email || null;
                    state.firstName = payload.data.user.firstName || null;
                    state.lastName = payload.data.user.lastName || null;
                    state.username = payload.data.user.username || null;
                    state.id = payload.data.user.id || null;
                }
            })
            .addCase(authActions.refreshSession.rejected, (state) => {
                state.isAuthenticated = false;
                state.email = null;
                state.firstName = null;
                state.lastName = null;
                state.username = null;
                state.id = null;
            })
            .addCase(authActions.isAuthenticated.pending, (state) => {
                state.isAuthLoading = true;
            })
            .addCase(authActions.isAuthenticated.fulfilled, (state, action) => {
                state.isAuthLoading = false;
                const payload = action.payload as ApiResponse & {
                    data?: {
                        user?: {
                            email?: string;
                            firstName?: string;
                            lastName?: string;
                            username?: string;
                            id?: string;
                        };
                    };
                };
                if (payload && payload.data && payload.data.user && payload.data.user.email) {
                    state.isAuthenticated = true;
                    state.email = payload.data.user.email || null;
                    state.firstName = payload.data.user.firstName || null;
                    state.lastName = payload.data.user.lastName || null;
                    state.username = payload.data.user.username || null;
                    state.id = payload.data.user.id || null;
                }
            })
            .addCase(authActions.isAuthenticated.rejected, (state) => {
                state.isAuthLoading = false;
                state.isAuthenticated = false;
                state.email = null;
                state.firstName = null;
                state.lastName = null;
                state.username = null;
                state.id = null;
            })
            .addCase(authActions.sendOtpForPasswordReset.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(authActions.sendOtpForPasswordReset.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(authActions.sendOtpForPasswordReset.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(authActions.verifyPasswordResetOtp.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(authActions.verifyPasswordResetOtp.fulfilled, (state) => {
                state.isLoading = false;
                state.verifiedForPasswordReset = true;
            })
            .addCase(authActions.verifyPasswordResetOtp.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(authActions.resetPassword.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(authActions.resetPassword.fulfilled, (state) => {
                state.isLoading = false;
                state.passwordResetEmail = null;
                state.verifiedForPasswordReset = false;
            })
            .addCase(authActions.resetPassword.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(authActions.isUsernameAvailable.pending, (state) => {
                state.usernameAvailability.loading = true;
                state.usernameAvailability.available = null;
            })
            .addCase(authActions.isUsernameAvailable.fulfilled, (state, action) => {
                state.usernameAvailability.loading = false;
                const payload = action.payload as ApiResponse & {
                    data?: {
                        available: boolean;
                    };
                };
                if (payload && payload.data && typeof payload.data.available === "boolean") {
                    state.usernameAvailability.available = payload.data.available;
                } else {
                    state.usernameAvailability.available = false;
                }
            })
            .addCase(authActions.isUsernameAvailable.rejected, (state) => {
                state.usernameAvailability.loading = false;
                state.usernameAvailability.available = false;
            });
    },
});

const authPersistConfig = {
    key: "auth",
    storage,
    whitelist: [
        "accountCreationEmail",
        "passwordResetEmail",
        "verifiedForAccountCreation",
        "verifiedForPasswordReset",
    ],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authSlice.reducer);

export const { setAccountCreationEmail, setPasswordResetEmail } = authSlice.actions;
export { authActions, persistedAuthReducer };
