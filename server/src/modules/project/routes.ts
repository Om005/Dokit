import express from "express";
import controllers from "./controllers";
import { authenticate } from "@middlewares/authenticate";
import validators from "./validators";
import validationMiddleware from "@middlewares/validation";

const router = express.Router();

router.use(authenticate);

router.post(
    "/create-project",
    validationMiddleware(validators.CreateProjectSchema),
    controllers.createProject
);
router.post(
    "/delete-project",
    validationMiddleware(validators.DeleteProjectSchema),
    controllers.deleteProject
);
router.get("/list-projects", controllers.listProjects);
router.get("/project-details", controllers.getProjectDetails);
router.post(
    "/start-project",
    validationMiddleware(validators.startProjectSchema),
    controllers.startProject
);
router.post(
    "/change-settings",
    validationMiddleware(validators.changeSettings),
    controllers.changeProjectSettings
);

router.post(
    "/close-project",
    validationMiddleware(validators.closeProjectSchema),
    controllers.closeProject
);

export default router;
