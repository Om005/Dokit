import express from "express";
import validators from "./validators";
import controllers from "./controllers";
import rateLimit from "@middlewares/rateLimiter";
import uaParserMiddleware from "@middlewares/UAparser";
import { locationMiddleware } from "@middlewares/location";
import { authenticate } from "@middlewares/authenticate";
import validationMiddleware from "@middlewares/validation";

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

router.delete(
    "/sign-out",
    authenticate,
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "sign-out" }),
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

router.get(
    "/is-authenticated",
    authenticate,
    rateLimit({ limit: 60, windowMs: 60 * 1000, prefix: "is-authenticated" }),
    controllers.isAuthenticated
);

router.get(
    "/is-username-available",
    rateLimit({ limit: 60, windowMs: 60 * 1000, prefix: "is-username-available" }),
    controllers.isUsernameAvailable
);

router.put(
    "/toggle-2fa",
    authenticate,
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "toggle-2fa" }),
    controllers.toggle2FA
);

router.post(
    "/verify-2fa-setup",
    authenticate,
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "verify-2fa-setup" }),
    validationMiddleware(validators.verify2FAsetup),
    controllers.verify2FAsetup
);

router.post(
    "/regenerate-backup-codes",
    authenticate,
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "regenerate-backup-codes" }),
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

router.delete(
    "/emergency-revoke-session",
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "emergency-revoke-session" }),
    controllers.emergencyRevokeSession
);

export default router;
