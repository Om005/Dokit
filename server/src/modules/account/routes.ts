import express from "express";
import controllers from "./controllers";
import validators from "./validators";
import validationMiddleware from "@middlewares/validation";
import rateLimit from "@middlewares/rateLimiter";
import { authenticate } from "@middlewares/authenticate";

const router = express.Router();

router.post(
    "/public-profile",
    rateLimit({ limit: 30, windowMs: 60 * 1000, prefix: "public-profile" }),
    validationMiddleware(validators.getPublicProfile),
    controllers.getPublicProfile
);

router.post(
    "/my-profile",
    authenticate,
    validationMiddleware(validators.getMyProfile),
    controllers.getMyProfile
);

router.post(
    "/update-settings",
    authenticate,
    validationMiddleware(validators.updateSettings),
    controllers.updateSettings
);

router.post(
    "/change-password",
    authenticate,
    validationMiddleware(validators.changePassword),
    controllers.changePassword
);

router.post(
    "/delete-account",
    authenticate,
    validationMiddleware(validators.deleteAccount),
    controllers.deleteAccount
);

router.post(
    "/sessions",
    authenticate,
    validationMiddleware(validators.listSessions),
    controllers.listSessions
);

router.post(
    "/logout-session",
    authenticate,
    validationMiddleware(validators.logoutSession),
    controllers.logoutSession
);

router.post(
    "/logout-other-sessions",
    authenticate,
    validationMiddleware(validators.logoutOtherSessions),
    controllers.logoutOtherSessions
);

router.post(
    "/profile-readme",
    authenticate,
    validationMiddleware(validators.updateProfileReadme),
    controllers.updateProfileReadme
);

router.post(
    "/pin-project",
    authenticate,
    validationMiddleware(validators.pinProject),
    controllers.pinProject
);

export default router;
