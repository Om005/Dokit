import express from "express";
import controllers from "./controllers";
import { authenticate } from "@middlewares/authenticate";

const router = express.Router();
router.use(authenticate);

router.get("/get-folder-content", controllers.getFolderContent);

router.get("/get-file-content", controllers.getFileContent);

router.post("/create-node", controllers.createNode);

router.delete("/delete-node", controllers.deleteNode);

router.put("/rename-node", controllers.renameNode);

router.post("/install-tool", controllers.installEnvironmentTool);

router.delete("/uninstall-tool", controllers.uninstallEnvironmentTool);

export default router;
