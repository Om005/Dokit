"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTransporter = exports.transporter = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
const env_1 = __importDefault(require("./env"));
const brevoClient = axios_1.default.create({
    baseURL: "https://api.brevo.com/v3",
    headers: {
        "api-key": env_1.default.BREVO_API_KEY,
        "Content-Type": "application/json",
    },
});
const transporter = {
    sendMail: async ({ from, to, subject, htmlContent }) => {
        try {
            await brevoClient.post("/smtp/email", {
                sender: {
                    email: from,
                },
                subject: subject,
                to: [
                    {
                        email: to,
                    },
                ],
                htmlContent: htmlContent,
            });
        }
        catch (error) {
            logger_1.default.error("Failed to send email");
            logger_1.default.error(error);
        }
    },
    verify: async () => {
        try {
            await brevoClient.get("/account");
            return true;
        }
        catch (error) {
            return false;
        }
    },
};
exports.transporter = transporter;
const verifyTransporter = async () => {
    const verified = await transporter.verify();
    if (verified) {
        logger_1.default.info("Email service configured correctly");
    }
    else {
        logger_1.default.error("Email service configuration failed");
    }
};
exports.verifyTransporter = verifyTransporter;
