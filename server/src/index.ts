import express, { Request, Response } from "express";
import env from "@config/env";
import { checkEnv } from "@config/checkEnv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "@modules/auth/routes";
import httpLogger from "@middlewares/httpLogger";
import extractIpMiddleware from "@middlewares/IP";
import { verifyTransporter } from "@config/mailer";
import queueActions from "@modules/queue/queue-actions";
import initiatWorkers from "@modules/queue/workers";
import { connectRedis } from "@config/redisClient";
import rateLimit from "@middlewares/rateLimiter";

checkEnv();
verifyTransporter();
initiatWorkers();
connectRedis();
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
app.use("/api/auth", authRoutes);

app.get("/", rateLimit({ limit: 2, windowMs: 60 * 1000 }), (req: Request, res: Response) => {
    // queueActions.addEmailToQueue({
    //     from: env.SENDER_EMAIL,
    //     to: "chavdaom84@gmail.com",
    //     subject: "Test Email",
    //     htmlContent: "<h1>Hello from the queue!</h1>",
    // });
    res.send("Email job added to the queue");
});

const PORT = env.PORT;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
