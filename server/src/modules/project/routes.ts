import express from "express";
import controllers from "./controllers";
import { authenticate } from "@middlewares/authenticate";

const router = express.Router();

router.use(authenticate);

router.post("/create", controllers.createProject);
router.delete("/delete/:projectId", controllers.deleteProject);

export default router;
