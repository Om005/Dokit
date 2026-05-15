"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const sendResponse = (res, { message, statusCode = http_status_codes_1.default.OK, success = true, ...other }) => {
    const resonse = {
        success,
        statusCode,
        message,
        ...other,
    };
    return res.status(statusCode).json(resonse);
};
exports.default = sendResponse;
