import express from "express";
import controllers from "./access.controller";
import { authenticate } from "@middlewares/authenticate";
import validators from "./validators";
import validationMiddleware from "@middlewares/validation";
import rateLimit from "@middlewares/rateLimiter";

const router = express.Router();

router.use(authenticate);

router.post(
    "/request-access",
    validationMiddleware(validators.requestAccessSchema),
    rateLimit({ limit: 5, windowMs: 60 * 60 * 1000, prefix: "request_access" }),
    controllers.requestAccess
);

router.post(
    "/review-request",
    validationMiddleware(validators.reviewAccessRequestSchema),
    rateLimit({ limit: 30, windowMs: 60 * 60 * 1000, prefix: "review_request" }),
    controllers.reviewAccessRequest
);

router.post(
    "/get-pending-requests",
    validationMiddleware(validators.getPendingAccessRequestsSchema),
    rateLimit({ limit: 10, windowMs: 60 * 60 * 1000, prefix: "get_pending_requests" }),
    controllers.getPendingAccessRequests
);

router.post(
    "/invite-member",
    validationMiddleware(validators.inviteMemberSchema),
    rateLimit({ limit: 10, windowMs: 60 * 60 * 1000, prefix: "invite_member" }),
    controllers.inviteMember
);

router.post(
    "/change-member-access",
    validationMiddleware(validators.changeMemberAccessLevelSchema),
    rateLimit({ limit: 20, windowMs: 60 * 60 * 1000, prefix: "change_member_access" }),
    controllers.changeMemberAccess
);

router.post(
    "/remove-member",
    validationMiddleware(validators.removeMemberSchema),
    rateLimit({ limit: 20, windowMs: 60 * 60 * 1000, prefix: "remove_member" }),
    controllers.removeMember
);

export default router;
