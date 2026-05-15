"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const validationMiddleware = (schema) => {
    return (req, res, next) => {
        let result;
        try {
            result = schema.safeParse(req.body);
            if (!result.success) {
                const message = JSON.parse(result.error.message)[0].message;
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                    message: message || "Invalid request",
                });
            }
            else {
                next();
            }
        }
        catch (error) {
            logger_1.default.error("Validation Middleware Error:");
            logger_1.default.error(error);
            next(error);
        }
    };
};
exports.default = validationMiddleware;
