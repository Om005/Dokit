import express from "express";
import controllers from "./controllers";
import rateLimit from "@middlewares/rateLimiter";
import { authenticate } from "@middlewares/authenticate";

const router = express.Router();

router.get(
    "/public-profile",
    rateLimit({ limit: 30, windowMs: 60 * 1000, prefix: "public-profile" }),
    controllers.getPublicProfile
);

router.get("/my-profile", authenticate, controllers.getMyProfile);

router.put("/update-settings", authenticate, controllers.updateSettings);

router.put("/change-password", authenticate, controllers.changePassword);

router.delete("/delete-account", authenticate, controllers.deleteAccount);

router.get("/sessions", authenticate, controllers.listSessions);

router.delete("/logout-session", authenticate, controllers.logoutSession);

router.delete("/logout-other-sessions", authenticate, controllers.logoutOtherSessions);

router.put("/profile-readme", authenticate, controllers.updateProfileReadme);

router.put("/pin-project", authenticate, controllers.pinProject);

router.get("/get-folder-content", controllers.getViewFolderContent);

router.get("/get-file-content", controllers.getViewFileContent);

router.get("/get-view-project", controllers.getViewProjectDetails);

export default router;
