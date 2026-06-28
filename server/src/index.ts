if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("module-alias/register");
}
import express from "express";
import env from "@config/env";
import { checkEnv } from "@config/checkEnv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "@modules/auth/routes";
import accountRoutes from "@modules/account/routes";
import projectRoutes from "@modules/project/routes";
import editorRoutes from "@modules/editor/routes";
import projectAccessRoutes from "@modules/project/access.routes";
import chatRoutes from "@modules/chat/routes";
import codelinkRoutes from "@modules/codelink/routes";
import httpLogger from "@middlewares/httpLogger";
import extractIpMiddleware from "@middlewares/IP";
import { verifyTransporter } from "@config/mailer";

import initiatWorkers from "@modules/queue/workers";
import { connectRedis } from "@config/redisClient";
import globalErrorHandler from "@middlewares/globalErrorHandler";
import { connectToDatabase } from "@db/prisma";
import { initGeoIP } from "@middlewares/location";
import { initializeBloomFilter } from "@config/bloomFilter";
import initializeScheduler from "jobs/scheduler";
import { createServer } from "http";
import { yjsWss } from "sockets/yjsServer";
import { Server } from "socket.io";
import projectSocket from "@sockets/projectSocket";

checkEnv();
connectToDatabase();
verifyTransporter();
initiatWorkers();
initGeoIP();
connectRedis();
initializeBloomFilter();
const app = express();

app.set("trust proxy", true);

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: env.FRONTEND_URL,
        credentials: true,
    })
);
app.use(httpLogger);
app.use(extractIpMiddleware);
app.use(globalErrorHandler);
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/project/access", projectAccessRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/editor", editorRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/codelink", codelinkRoutes);
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

const httpServer = createServer(app);

export const io = new Server(httpServer, {
    cors: {
        origin: env.FRONTEND_URL,
        credentials: true,
    },
});

projectSocket(io);

httpServer.on("upgrade", (request, socket, head) => {
    const pathname = request.url || "";

    if (pathname.startsWith("/socket.io/")) {
        return;
    }
    yjsWss.handleUpgrade(request, socket, head, (ws) => {
        yjsWss.emit("connection", ws, request);
    });
});

const PORT = env.PORT;

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

    initializeScheduler();
});
