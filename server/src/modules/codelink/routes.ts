import express from "express";
import controllers from "./controller";
import { authenticate, optionalAuthenticate } from "@middlewares/authenticate";

const router = express.Router();

router.post("/create-codelink", authenticate, controllers.createCodeLink);
router.get("/list-codelinks", authenticate, controllers.getCodeLinks);
router.get("/get-codelink", optionalAuthenticate, controllers.getCodeLink);
router.delete("/delete-codelink", authenticate, controllers.deleteCodeLink);
router.put("/update-codelink", authenticate, controllers.updateCodeLink);

export default router;
