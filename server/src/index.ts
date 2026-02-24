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
import rateLimit from "@middlewares/rateLimiter";
import globalErrorHandler from "@middlewares/globalErrorHandler";
import { connectToDatabase } from "@db/prisma";
import { initGeoIP, locationMiddleware } from "@middlewares/location";
import uaParserMiddleware from "@middlewares/UAparser";
import { initializeBloomFilter } from "@config/bloomFilter";
import createDokitContainer from "services/dockerManager";

checkEnv();
connectToDatabase();
// verifyTransporter();
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

const PORT = env.PORT;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
