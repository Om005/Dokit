"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const env_1 = __importDefault(require("../config/env"));
const path_1 = __importDefault(require("path"));
const logDir = path_1.default.resolve(process.cwd(), "logs");
const isProd = env_1.default.IS_PRODUCTION;
const targets = [];
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
targets.push({
    target: "pino/file",
    level: "info",
    options: {
        destination: path_1.default.resolve(logDir, `app-${isProd ? "prod" : "dev"}.log`),
        mkdir: true,
    },
}, {
    target: "pino/file",
    level: "error",
    options: {
        destination: path_1.default.resolve(logDir, `error-${isProd ? "prod" : "dev"}.log`),
        mkdir: true,
    },
});
const transport = pino_1.default.transport({ targets });
const logger = (0, pino_1.default)({
    level: env_1.default.IS_PRODUCTION ? "info" : "debug",
}, transport);
exports.default = logger;
