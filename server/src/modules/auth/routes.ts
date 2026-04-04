import validationMiddleware from "@middlewares/validation";
import express from "express";
import validators from "./validators";
import controllers from "./controllers";
import rateLimit from "@middlewares/rateLimiter";
import uaParserMiddleware from "@middlewares/UAparser";
import { locationMiddleware } from "@middlewares/location";
import { authenticate } from "@middlewares/authenticate";

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
    validationMiddleware(validators.verifyAccountCreationOtp),
    controllers.verifyAccountCreationOtp
);

router.post(
    "/create-account",
    rateLimit({ limit: 5, windowMs: 60 * 1000, prefix: "create-account" }),
    validationMiddleware(validators.createAccount),
    uaParserMiddleware,
    locationMiddleware,
    controllers.createAccount
);

router.post(
    "/sign-in",
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "sign-in" }),
    validationMiddleware(validators.signIn),
    uaParserMiddleware,
    locationMiddleware,
    controllers.signIn
);

router.post(
    "/sign-out",
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "sign-out" }),
    authenticate,
    controllers.signOut
);

router.post(
    "/refresh-session",
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "refresh-session" }),
    uaParserMiddleware,
    locationMiddleware,
    controllers.refreshSession
);

router.post(
    "/send-otp-for-password-reset",
    rateLimit({ limit: 5, windowMs: 60 * 1000, prefix: "send-otp-password-reset" }),
    validationMiddleware(validators.sendOtpForPasswordReset),
    controllers.sendOtpForPasswordReset
);

router.post(
    "/verify-password-reset-otp",
    rateLimit({ limit: 5, windowMs: 60 * 1000, prefix: "verify-password-reset-otp" }),
    validationMiddleware(validators.verifyPasswordResetOtp),
    controllers.verifyPasswordResetOtp
);

router.post(
    "/reset-password",
    rateLimit({ limit: 5, windowMs: 60 * 1000, prefix: "reset-password" }),
    validationMiddleware(validators.resetPassword),
    controllers.resetPassword
);

router.post(
    "/is-authenticated",
    rateLimit({ limit: 60, windowMs: 60 * 1000, prefix: "is-authenticated" }),
    authenticate,
    controllers.isAuthenticated
);

router.post(
    "/is-username-available",
    rateLimit({ limit: 60, windowMs: 60 * 1000, prefix: "is-username-available" }),
    validationMiddleware(validators.isUsernameAvailable),
    controllers.isUsernameAvailable
);

router.post(
    "/toggle-2fa",
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "toggle-2fa" }),
    authenticate,
    validationMiddleware(validators.toggle2FA),
    controllers.toggle2FA
);

router.post(
    "/verify-2fa-setup",
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "verify-2fa-setup" }),
    authenticate,
    validationMiddleware(validators.verify2FAsetup),
    controllers.verify2FAsetup
);

router.post(
    "/regenerate-backup-codes",
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "regenerate-backup-codes" }),
    authenticate,
    validationMiddleware(validators.regenerateBackupCodes),
    controllers.regenerateBackupCodes
);

router.post(
    "/verify-2fa-for-sign-in",
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "verify-2fa-for-sign-in" }),
    validationMiddleware(validators.verify2FAForSignIn),
    uaParserMiddleware,
    locationMiddleware,
    controllers.verify2FAForSignIn
);

export default router;
