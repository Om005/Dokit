import express, { Request, Response } from "express";
import env from "@config/env";
import { checkEnv } from "@config/checkEnv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "@modules/auth/routes";
import projectRoutes from "@modules/project/routes";
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
import DockerManager from "services/dockerManager";

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
app.use("/api/project", projectRoutes);

app.post("/sync", async (req: Request, res: Response) => {
    try {
        const { projectId } = req.body;
        if (!projectId) {
            return res.status(400).json({ error: "Missing projectId" });
        }
        const result = await DockerManager.syncWorkspaceToR2(projectId);
        res.json(result);
    } catch (error) {
        console.error("Error syncing workspace to R2:", error);
        res.status(500).json({ error: "Failed to sync workspace to R2" });
    }
});

const PORT = env.PORT;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

    initializeScheduler();
});
