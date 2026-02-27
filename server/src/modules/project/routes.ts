import express from "express";
import controllers from "./controllers";
import { authenticate } from "@middlewares/authenticate";

const router = express.Router();

router.use(authenticate);

router.post("/create-project", controllers.createProject);
router.delete("/delete-project", controllers.deleteProject);
router.get("/list-projects", controllers.listProjects);
router.post("/start-project", controllers.startProject);

export default router;
