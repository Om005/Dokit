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

    cron.schedule("0 * * * *", async () => {
        try {
            await DockerManager.syncAllcontainersToR2();
        } catch (error) {
            logger.error("Error running scheduled sync to R2:");
            logger.error(error);
        }
    });
};

export default initializeScheduler;
