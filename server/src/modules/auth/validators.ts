import { email, z } from "zod";

const validators = {
    sendOtpForAccountCreation: z.object({
        email: z.string().email("Invalid email address"),
    }),

    verifyAccountCreationOtp: z.object({
        email: z.string().email("Invalid email address"),
        otp: z.string().length(6, "OTP must be 6 characters long"),
    }),

    createAccount: z.object({
        email: z.string().email("Invalid email address"),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
                /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\W_]).+$/,
                "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            ),

        firstName: z.string().min(1, "First name is required"),

        lastName: z.string().min(1, "Last name is required"),

        username: z
            .string()
            .min(3, "Username must be at least 3 characters")
            .max(20, "Username must be at most 20 characters")
            .regex(
                /^[a-zA-Z0-9_]+$/,
                "Username can only contain letters, numbers, and underscores"
            ),
    }),

    signIn: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
    }),

    sendOtpForPasswordReset: z.object({
        email: z.string().email("Invalid email address"),
    }),

    verifyPasswordResetOtp: z.object({
        email: z.string().email("Invalid email address"),
        otp: z.string().length(6, "OTP must be 6 characters long"),
    }),

    resetPassword: z.object({
        email: z.string().email("Invalid email address"),

        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
                /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\W_]).+$/,
                "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            ),
    }),

    isUsernameAvailable: z.object({
        username: z
            .string()
            .min(3, "Username must be at least 3 characters")
            .max(20, "Username must be at most 20 characters")
            .regex(
                /^[a-zA-Z0-9_]+$/,
                "Username can only contain letters, numbers, and underscores"
            ),
    }),

    toggle2FA: z.object({
        password: z.string().min(1, "Password is required"),
    }),

    verify2FAsetup: z.object({
        token: z
            .string()
            .length(6, "Token must be 6 characters long")
            .regex(/^\d+$/, "Token must be a number"),
    }),

    regenerateBackupCodes: z.object({
        password: z.string().min(1, "Password is required"),
    }),

    verify2FAForSignIn: z.object({
        preAuthToken: z
            .string()
            .min(1, "Login session expired or invalid, please enter your email and password again"),
        token: z
            .string()
            .length(6, "Token must be 6 characters long")
            .regex(/^\d+$/, "Token must be a number")
            .optional(),
        backupCode: z.string().length(8, "Backup code must be 8 characters long").optional(),
    }),
};

export default validators;
