import express from "express";
import controllers from "./access.controller";
import { authenticate } from "@middlewares/authenticate";
import validators from "./validators";
import validationMiddleware from "@middlewares/validation";
import rateLimit from "@middlewares/rateLimiter";

const router = express.Router();

router.post(
    "/request-access",
    authenticate,
    validationMiddleware(validators.requestAccessSchema),
    rateLimit({ limit: 5, windowMs: 60 * 60 * 1000, prefix: "request_access" }),
    controllers.requestAccess
);

router.post(
    "/review-request",
    authenticate,
    validationMiddleware(validators.reviewAccessRequestSchema),
    rateLimit({ limit: 30, windowMs: 60 * 60 * 1000, prefix: "review_request" }),
    controllers.reviewAccessRequest
);

router.post(
    "/get-pending-requests",
    authenticate,
    validationMiddleware(validators.getPendingAccessRequestsSchema),
    rateLimit({ limit: 10, windowMs: 60 * 60 * 1000, prefix: "get_pending_requests" }),
    controllers.getPendingAccessRequests
);

router.post(
    "/invite-member",
    authenticate,
    validationMiddleware(validators.inviteMemberSchema),
    rateLimit({ limit: 10, windowMs: 60 * 60 * 1000, prefix: "invite_member" }),
    controllers.inviteMember
);

router.post(
    "/change-member-access",
    authenticate,
    validationMiddleware(validators.changeMemberAccessLevelSchema),
    rateLimit({ limit: 20, windowMs: 60 * 60 * 1000, prefix: "change_member_access" }),
    controllers.changeMemberAccess
);

router.post(
    "/remove-member",
    authenticate,
    validationMiddleware(validators.removeMemberSchema),
    rateLimit({ limit: 20, windowMs: 60 * 60 * 1000, prefix: "remove_member" }),
    controllers.removeMember
);

router.get("/verify-terminal", authenticate, controllers.verifyTeminalAccess);
router.get("/verify-preview", controllers.verifyPreviewAccess);
router.get("/preview-auth", controllers.previewAuth);
export default router;
