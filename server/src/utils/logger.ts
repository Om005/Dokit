import pino from "pino";
import env from "@config/env";
import path from "path";

const logDir = path.resolve(process.cwd(), "logs");
const isProd = env.IS_PRODUCTION;

const targets: pino.TransportTargetOptions[] = [];

if (!isProd) {
    targets.push({
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
        },
    });
}

targets.push(
    {
        target: "pino/file",
        level: "info",
        options: {
            destination: path.resolve(logDir, `app-${isProd ? "prod" : "dev"}.log`),
            mkdir: true,
        },
    },
    {
        target: "pino/file",
        level: "error",
        options: {
            destination: path.resolve(logDir, `error-${isProd ? "prod" : "dev"}.log`),
            mkdir: true,
        },
    }
);
const transport = pino.transport({ targets });

const logger = pino(
    {
        level: env.IS_PRODUCTION ? "info" : "debug",
    },
    transport
);

export default logger;
