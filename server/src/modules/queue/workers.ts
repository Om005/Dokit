import { Worker } from "bullmq";
import redisConfig from "@config/redisQueue";
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

    const removeRequestWorker = new Worker(queues.REMOVE_REQUEST_QUEUE, workers.removeRequest, {
        connection: redisConfig,
        concurrency: 5,
    });

    const createEmbeddingsWorker = new Worker(
        queues.CREATE_EMBEDDINGS_QUEUE,
        workers.createEmbeddings,
        {
            connection: redisConfig,
            concurrency: 5,
        }
    );

    return [
        emailWorker,
        cleanContainersWorker,
        deleteProjectWorker,
        updateProjectLastAccessedWorker,
        syncToR2Worker,
        removeRequestWorker,
        createEmbeddingsWorker,
    ];
};

export default initiatWorkers;
