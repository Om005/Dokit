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
    toggle2FALoading: boolean;
    verify2FASetupLoading: boolean;
    regenerateBackupCodesLoading: boolean;
    verify2FAForSignInLoading: boolean;
    emergencyRevokeSessionLoading: boolean;
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

    toggle2FA: createAsyncThunk<ApiResponse, { password: string }, { rejectValue: ApiResponse }>(
        "auth/toggle2FA",
        createApiHandler<{ password: string }>("/api/auth/toggle-2fa")
    ),

    verify2FAsetup: createAsyncThunk<ApiResponse, { token: string }, { rejectValue: ApiResponse }>(
        "auth/verify2FAsetup",
        createApiHandler<{ token: string }>("/api/auth/verify-2fa-setup")
    ),

    regenerateBackupCodes: createAsyncThunk<
        ApiResponse,
        { password: string },
        { rejectValue: ApiResponse }
    >(
        "auth/regenerateBackupCodes",
        createApiHandler<{ password: string }>("/api/auth/regenerate-backup-codes")
    ),

    verify2FAForSignIn: createAsyncThunk<
        ApiResponse,
        { preAuthToken: string; token?: string; code?: string },
        { rejectValue: ApiResponse }
    >(
        "auth/verify2FAForSignIn",
        createApiHandler<{ preAuthToken: string; token?: string; code?: string }>(
            "/api/auth/verify-2fa-for-sign-in"
        )
    ),

    emergencyRevokeSession: createAsyncThunk<
        ApiResponse,
        { token: string },
        { rejectValue: ApiResponse }
    >(
        "auth/emergencyRevokeSession",
        createApiHandler<{ token: string }>("/api/auth/emergency-revoke-session")
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
    toggle2FALoading: false,
    verify2FASetupLoading: false,
    regenerateBackupCodesLoading: false,
    verify2FAForSignInLoading: false,
    emergencyRevokeSessionLoading: false,
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
        clearAuth(state) {
            state.isAuthenticated = false;
            state.email = null;
            state.firstName = null;
            state.lastName = null;
            state.username = null;
            state.id = null;
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
            })
            .addCase(authActions.toggle2FA.pending, (state) => {
                state.toggle2FALoading = true;
            })
            .addCase(authActions.toggle2FA.fulfilled, (state) => {
                state.toggle2FALoading = false;
            })
            .addCase(authActions.toggle2FA.rejected, (state) => {
                state.toggle2FALoading = false;
            })
            .addCase(authActions.verify2FAsetup.pending, (state) => {
                state.verify2FASetupLoading = true;
            })
            .addCase(authActions.verify2FAsetup.fulfilled, (state) => {
                state.verify2FASetupLoading = false;
            })
            .addCase(authActions.verify2FAsetup.rejected, (state) => {
                state.verify2FASetupLoading = false;
            })
            .addCase(authActions.regenerateBackupCodes.pending, (state) => {
                state.regenerateBackupCodesLoading = true;
            })
            .addCase(authActions.regenerateBackupCodes.fulfilled, (state) => {
                state.regenerateBackupCodesLoading = false;
            })
            .addCase(authActions.regenerateBackupCodes.rejected, (state) => {
                state.regenerateBackupCodesLoading = false;
            })
            .addCase(authActions.verify2FAForSignIn.pending, (state) => {
                state.verify2FAForSignInLoading = true;
            })
            .addCase(authActions.verify2FAForSignIn.fulfilled, (state, action) => {
                state.verify2FAForSignInLoading = false;
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
            .addCase(authActions.verify2FAForSignIn.rejected, (state) => {
                state.verify2FAForSignInLoading = false;
            })
            .addCase(authActions.emergencyRevokeSession.pending, (state) => {
                state.emergencyRevokeSessionLoading = true;
            })
            .addCase(authActions.emergencyRevokeSession.fulfilled, (state) => {
                state.emergencyRevokeSessionLoading = false;
            })
            .addCase(authActions.emergencyRevokeSession.rejected, (state) => {
                state.emergencyRevokeSessionLoading = false;
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

export const { setAccountCreationEmail, setPasswordResetEmail, clearAuth } = authSlice.actions;
export { authActions, persistedAuthReducer };
