import logger from "@utils/logger";
import pinoHttp from "pino-http";

const httpLogger = pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    },

    customReceivedMessage: (req) => `Received request: ${req.method} ${req.url}`,

    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,

    customErrorMessage: (req, res, err) =>
        `${req.method} ${req.url} ${res.statusCode} - ${err?.message || "Unknown error"}`,

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

export default httpLogger;
