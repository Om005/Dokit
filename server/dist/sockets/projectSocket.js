"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = projectSocket;
const logger_1 = __importDefault(require("../utils/logger"));
function projectSocket(io) {
    io.on("connection", (socket) => {
        logger_1.default.info("Client connected: " + socket.id);
        socket.on("join-project", (projectId) => {
            socket.join(projectId);
            logger_1.default.info(`Client ${socket.id} joined project ${projectId}`);
        });
        socket.on("disconnect", () => {
            logger_1.default.info("Client disconnected: " + socket.id);
        });
    });
}
