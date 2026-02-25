import logger from "@utils/logger";
import cron from "node-cron";
import DockerManager from "services/dockerManager";

const initializeScheduler = () => {
    cron.schedule("*/15 * * * *", async () => {
        try {
            await DockerManager.cleanupOldContainers();
        } catch (error) {
            logger.error("Error running scheduled container cleanup:");
            logger.error(error);
        }
    });
};

export default initializeScheduler;
