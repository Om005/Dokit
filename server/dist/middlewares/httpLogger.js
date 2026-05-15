"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const pino_http_1 = __importDefault(require("pino-http"));
const httpLogger = (0, pino_http_1.default)({
    logger: logger_1.default,
    customLogLevel: (req, res, err) => {
        if (err || res.statusCode >= 500)
            return "error";
        if (res.statusCode >= 400)
            return "warn";
        return "info";
    },
    customReceivedMessage: (req) => `Received request: ${req.method} ${req.url}`,
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} - ${err?.message || "Unknown error"}`,
    serializers: {
        req: (req) => undefined,
        res: (res) => ({
            statusCode: res.statusCode,
        }),
        err: (err) => ({
            message: err?.message,
            stack: err?.stack,
        }),
    },
    wrapSerializers: true,
});
exports.default = httpLogger;
