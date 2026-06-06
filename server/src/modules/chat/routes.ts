import express from "express";
import controllers from "./controllers";
import validators from "./validators";
import validationMiddleware from "@middlewares/validation";
import rateLimit from "@middlewares/rateLimiter";
import { authenticate } from "@middlewares/authenticate";

const router = express.Router();

router.use(authenticate);

router.post("/create-chat", validationMiddleware(validators.createChat), controllers.createChat);

router.post("/list-chats", validationMiddleware(validators.listChats), controllers.getChats);

router.post("/get-chat", validationMiddleware(validators.getChat), controllers.getChat);

router.post("/add-message", validationMiddleware(validators.addMessage), controllers.addMessage);

router.post("/delete-chat", validationMiddleware(validators.deleteChat), controllers.deleteChat);

router.post(
    "/project-chat",
    validationMiddleware(validators.handleProjectChat),
    rateLimit({ limit: 20, windowMs: 60 * 1000, prefix: "project_chat" }),
    controllers.handleProjectChat
);

export default router;
