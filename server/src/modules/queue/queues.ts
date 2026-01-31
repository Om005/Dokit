import { Queue } from "bullmq";
import redisConfig from "@config/redisQueue";
import { MailerOptions } from "@config/mailer";
import logger from "@utils/logger";
import { EMAIL_QUEUE } from "./queue-names";

const emailQueue = new Queue<MailerOptions>(EMAIL_QUEUE, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});

export { emailQueue };
