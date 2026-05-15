"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const validators = {
    sendOtpForAccountCreation: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address"),
    }),
    verifyAccountCreationOtp: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address"),
        otp: zod_1.z.string().length(6, "OTP must be 6 characters long"),
    }),
    createAccount: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address"),
        password: zod_1.z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\W_]).+$/, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
        firstName: zod_1.z.string().min(1, "First name is required"),
        lastName: zod_1.z.string().min(1, "Last name is required"),
        username: zod_1.z
            .string()
            .min(3, "Username must be at least 3 characters")
            .max(20, "Username must be at most 20 characters")
            .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    }),
    signIn: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address"),
        password: zod_1.z.string().min(1, "Password is required"),
    }),
    sendOtpForPasswordReset: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address"),
    }),
    verifyPasswordResetOtp: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address"),
        otp: zod_1.z.string().length(6, "OTP must be 6 characters long"),
    }),
    resetPassword: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address"),
        newPassword: zod_1.z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\W_]).+$/, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    }),
    isUsernameAvailable: zod_1.z.object({
        username: zod_1.z
            .string()
            .min(3, "Username must be at least 3 characters")
            .max(20, "Username must be at most 20 characters")
            .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    }),
    toggle2FA: zod_1.z.object({
        password: zod_1.z.string().min(1, "Password is required"),
    }),
    verify2FAsetup: zod_1.z.object({
        token: zod_1.z
            .string()
            .length(6, "Token must be 6 characters long")
            .regex(/^\d+$/, "Token must be a number"),
    }),
    regenerateBackupCodes: zod_1.z.object({
        password: zod_1.z.string().min(1, "Password is required"),
    }),
    verify2FAForSignIn: zod_1.z.object({
        preAuthToken: zod_1.z
            .string()
            .min(1, "Login session expired or invalid, please enter your email and password again"),
        token: zod_1.z
            .string()
            .length(6, "Token must be 6 characters long")
            .regex(/^\d+$/, "Token must be a number")
            .optional(),
        backupCode: zod_1.z.string().length(8, "Backup code must be 8 characters long").optional(),
    }),
    emergencyRevokeSession: zod_1.z.object({
        token: zod_1.z.string().min(1, "Invalid link"),
    }),
};
exports.default = validators;
