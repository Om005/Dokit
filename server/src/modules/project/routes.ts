import express from "express";
import controllers from "./controllers";
import { authenticate } from "@middlewares/authenticate";
import validators from "./validators";
import validationMiddleware from "@middlewares/validation";
import rateLimit from "@middlewares/rateLimiter";

const router = express.Router();

router.use(authenticate);

router.post(
    "/create-project",
    validationMiddleware(validators.CreateProjectSchema),
    rateLimit({ limit: 3, windowMs: 60 * 60 * 1000, prefix: "create_project" }),
    controllers.createProject
);
router.post(
    "/delete-project",
    validationMiddleware(validators.DeleteProjectSchema),
    rateLimit({ limit: 3, windowMs: 60 * 60 * 1000, prefix: "delete_project" }),
    controllers.deleteProject
);
router.get("/list-projects", controllers.listProjects);
router.get("/project-details", controllers.getProjectDetails);
router.post(
    "/start-project",
    validationMiddleware(validators.startProjectSchema),
    rateLimit({ limit: 3, windowMs: 60 * 60 * 1000, prefix: "start_project" }),
    controllers.startProject
);
router.post(
    "/change-settings",
    validationMiddleware(validators.changeSettings),
    rateLimit({ limit: 5, windowMs: 60 * 60 * 1000, prefix: "change_settings" }),
    controllers.changeProjectSettings
);

router.post(
    "/close-project",
    validationMiddleware(validators.closeProjectSchema),
    rateLimit({ limit: 5, windowMs: 60 * 60 * 1000, prefix: "close_project" }),
    controllers.closeProject
);

export default router;
