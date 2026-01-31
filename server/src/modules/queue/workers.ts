import { Worker } from "bullmq";
import { transporter } from "@config/mailer";
import redisConfig from "@config/redisQueue";
import { MailerOptions } from "@config/mailer";
import logger from "@utils/logger";
import { EMAIL_QUEUE } from "./queue-names";
import workers from "./worker-actions";

const initiatWorkers = () => {
    const emailWorker = new Worker(EMAIL_QUEUE, workers.sendEmail, {
        connection: redisConfig,
        concurrency: 10,
    });
};

export default initiatWorkers;
