import logger from "@utils/logger";
import { Server } from "socket.io";

export default function projectSocket(io: Server) {
    io.on("connection", (socket) => {
        logger.info("Client connected: " + socket.id);

        socket.on("join-project", (projectId) => {
            socket.join(projectId);
            logger.info(`Client ${socket.id} joined project ${projectId}`);
        });
        socket.on("disconnect", () => {
            logger.info("Client disconnected: " + socket.id);
        });
    });
}
