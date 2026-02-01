import { email, z } from "zod";

const validators = {
    sendOtpForAccountCreation: z.object({
        email: z.string().email(),
    }),
};

export default validators;
