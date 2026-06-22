import express from "express";
import controllers from "./controllers";
import { authenticate } from "@middlewares/authenticate";
import rateLimit from "@middlewares/rateLimiter";

const router = express.Router();

router.get(
    "/download-project",
    rateLimit({ limit: 3, windowMs: 60 * 1000, prefix: "download_project" }),
    controllers.downloadProject
);

router.use(authenticate);

router.post(
    "/create-project",
    rateLimit({ limit: 3, windowMs: 60 * 1000, prefix: "create_project" }),
    controllers.createProject
);
router.delete(
    "/delete-project",
    rateLimit({ limit: 3, windowMs: 60 * 1000, prefix: "delete_project" }),
    controllers.deleteProject
);
router.get("/list-projects", controllers.listProjects);
router.get("/project-details", controllers.getProjectDetails);
router.post(
    "/start-project",
    rateLimit({ limit: 3, windowMs: 60 * 1000, prefix: "start_project" }),
    controllers.startProject
);
router.put(
    "/change-settings",
    rateLimit({ limit: 5, windowMs: 60 * 1000, prefix: "change_settings" }),
    controllers.changeProjectSettings
);

router.post(
    "/close-project",
    rateLimit({ limit: 5, windowMs: 60 * 1000, prefix: "close_project" }),
    controllers.closeProject
);

router.post(
    "/create-project-from-github",
    rateLimit({ limit: 3, windowMs: 60 * 1000, prefix: "create_project_from_github" }),
    controllers.createProjectFromGitHub
);

export default router;
