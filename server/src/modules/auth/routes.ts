import validationMiddleware from "@middlewares/validation";
import express from "express";
import validators from "./validators";
import controllers from "./controllers";
import rateLimit from "@middlewares/rateLimiter";

const router = express.Router();

router.post(
    "/send-otp-to-create-account",
    rateLimit({ limit: 5, windowMs: 60 * 1000, prefix: "send-otp-create-account" }),
    validationMiddleware(validators.sendOtpForAccountCreation),
    controllers.sendOtpForAccountCreation
);

router.post(
    "/verify-account-creation-otp",
    rateLimit({ limit: 5, windowMs: 60 * 1000, prefix: "verify-account-creation-otp" }),
    validationMiddleware(validators.verifyRegistrationOtp),
    controllers.verifyAccountCreationOtp
);

export default router;
