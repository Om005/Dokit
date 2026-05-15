"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong!";
    return (0, sendResponse_1.default)(res, {
        success: false,
        statusCode,
        message,
    });
};
exports.default = globalErrorHandler;
