import express, { Request, Response } from "express";
import env from "@config/env";
import { checkEnv } from "@config/checkEnv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "@modules/auth/routes";

checkEnv();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: env.FRONTEND_URL,
        credentials: true,
    })
);

app.use("/auth", authRoutes);

const PORT = env.PORT;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
