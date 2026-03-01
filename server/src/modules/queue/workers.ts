import { Worker } from "bullmq";
import { transporter } from "@config/mailer";
import redisConfig from "@config/redisQueue";
import { MailerOptions } from "@config/mailer";
import logger from "@utils/logger";
import queues from "./queueNames";
import workers from "./workerActions";

const initiatWorkers = () => {
    const emailWorker = new Worker(queues.EMAIL_QUEUE, workers.sendEmail, {
        connection: redisConfig,
        concurrency: 10,
    });

    const cleanContainersWorker = new Worker(
        queues.CLEAN_CONTAINERS_QUEUE,
        workers.cleanupContainer,
        {
            connection: redisConfig,
            concurrency: 5,
        }
    );

    const deleteProjectWorker = new Worker(queues.DELETE_PROJECT_QUEUE, workers.deleteProject, {
        connection: redisConfig,
        concurrency: 5,
    });

    const updateProjectLastAccessedWorker = new Worker(
        queues.UPDATE_PROJECT_LAST_ACCESSED_QUEUE,
        workers.updateProjectLastAccessed,
        {
            connection: redisConfig,
            concurrency: 5,
        }
    );

    const syncToR2Worker = new Worker(queues.SYNC_TO_R2_QUEUE, workers.syncToR2, {
        connection: redisConfig,
        concurrency: 5,
    });
};

export default initiatWorkers;
