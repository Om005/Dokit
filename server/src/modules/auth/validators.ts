import { email, z } from "zod";

const validators = {
    sendOtpForAccountCreation: z.object({
        email: z.string().email(),
    }),

    verifyAccountCreationOtp: z.object({
        email: z.string().email(),
        otp: z.string().length(6),
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
};

export default validators;
