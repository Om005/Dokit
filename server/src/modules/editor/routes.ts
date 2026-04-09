import validationMiddleware from "@middlewares/validation";
import express from "express";
import validators from "./validators";
import controllers from "./controllers";
import { authenticate } from "@middlewares/authenticate";

const router = express.Router();
router.use(authenticate);

router.post(
    "/get-folder-content",
    validationMiddleware(validators.getFolderContent),
    controllers.getFolderContent
);

router.post(
    "/get-file-content",
    validationMiddleware(validators.getFileContent),
    controllers.getFileContent
);

router.post("/create-node", validationMiddleware(validators.createNode), controllers.createNode);

router.post("/delete-node", validationMiddleware(validators.deleteNode), controllers.deleteNode);

router.post("/rename-node", validationMiddleware(validators.renameNode), controllers.renameNode);

router.post(
    "/install-tool",
    validationMiddleware(validators.installEnvironmentTool),
    controllers.installEnvironmentTool
);

router.post(
    "/uninstall-tool",
    validationMiddleware(validators.uninstallEnvironmentTool),
    controllers.uninstallEnvironmentTool
);

export default router;
