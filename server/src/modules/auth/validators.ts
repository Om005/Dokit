import { email, z } from "zod";

const validators = {
    sendOtpForAccountCreation: z.object({
        email: z.string().email(),
    }),

    verifyRegistrationOtp: z.object({
        email: z.string().email(),
        otp: z.string().length(6),
    }),

    signUp: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        username: z.string().min(3),
    }),
};

export default validators;
