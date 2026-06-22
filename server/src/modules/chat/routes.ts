import express from "express";
import controllers from "./controllers";
import rateLimit from "@middlewares/rateLimiter";
import { authenticate } from "@middlewares/authenticate";

const router = express.Router();

router.use(authenticate);

router.post("/create-chat", controllers.createChat);

router.get("/list-chats", controllers.getChats);

router.get("/get-chat", controllers.getChat);

router.post("/add-message", controllers.addMessage);

router.delete("/delete-chat", controllers.deleteChat);

router.post(
    "/project-chat",
    rateLimit({ limit: 20, windowMs: 60 * 1000, prefix: "project_chat" }),
    controllers.handleProjectChat
);

export default router;
