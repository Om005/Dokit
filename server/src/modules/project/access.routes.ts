import express from "express";
import controllers from "./access.controller";
import { authenticate } from "@middlewares/authenticate";
import rateLimit from "@middlewares/rateLimiter";

const router = express.Router();

router.post(
    "/request-access",
    authenticate,
    rateLimit({ limit: 5, windowMs: 60 * 1000, prefix: "request_access" }),
    controllers.requestAccess
);

router.put(
    "/review-request",
    authenticate,
    rateLimit({ limit: 30, windowMs: 60 * 1000, prefix: "review_request" }),
    controllers.reviewAccessRequest
);

router.get(
    "/get-pending-requests",
    authenticate,
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "get_pending_requests" }),
    controllers.getPendingAccessRequests
);

router.post(
    "/invite-member",
    authenticate,
    rateLimit({ limit: 10, windowMs: 60 * 1000, prefix: "invite_member" }),
    controllers.inviteMember
);

router.put(
    "/change-member-access",
    authenticate,
    rateLimit({ limit: 20, windowMs: 60 * 1000, prefix: "change_member_access" }),
    controllers.changeMemberAccess
);

router.delete(
    "/remove-member",
    authenticate,
    rateLimit({ limit: 20, windowMs: 60 * 1000, prefix: "remove_member" }),
    controllers.removeMember
);

router.get("/verify-terminal", controllers.verifyTerminalAccess);
router.get("/terminal-token", authenticate, controllers.terminalToken);
router.get("/verify-preview", controllers.verifyPreviewAccess);
router.get("/preview-auth", controllers.previewAuth);
export default router;
