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

export default router;
