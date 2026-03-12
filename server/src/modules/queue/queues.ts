import { Queue } from "bullmq";
import redisConfig from "@config/redisQueue";
import { MailerOptions } from "@config/mailer";
import queues from "./queueNames";

const emailQueue = new Queue<MailerOptions>(queues.EMAIL_QUEUE, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});

const cleanContainersQueue = new Queue(queues.CLEAN_CONTAINERS_QUEUE, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});

const deleteProjectQueue = new Queue(queues.DELETE_PROJECT_QUEUE, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});

const updateProjectLastAccessedQueue = new Queue(queues.UPDATE_PROJECT_LAST_ACCESSED_QUEUE, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});

const syncToR2Queue = new Queue(queues.SYNC_TO_R2_QUEUE, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});

const removeRequestQueue = new Queue(queues.REMOVE_REQUEST_QUEUE, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});

export {
    emailQueue,
    cleanContainersQueue,
    deleteProjectQueue,
    updateProjectLastAccessedQueue,
    syncToR2Queue,
    removeRequestQueue,
};
