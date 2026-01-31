import { MailerOptions } from "@config/mailer";
import logger from "@utils/logger";
import { emailQueue } from "./queues";

const queueActions = {
    addEmailToQueue: async ({ from, to, subject, htmlContent }: MailerOptions) => {
        emailQueue.add(
            "send-email",
            {
                from,
                to,
                subject,
                htmlContent,
            },
            {
                removeOnComplete: true,
                removeOnFail: { count: 10 },
            }
        );
        logger.info(`Email job added to the queue for ${to}`);
    },
};
export default queueActions;
