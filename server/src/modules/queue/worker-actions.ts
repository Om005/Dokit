import { transporter } from "@config/mailer";
import { MailerOptions } from "@config/mailer";
import logger from "@utils/logger";
import type { Job } from "bullmq";

const workers = {
    sendEmail: async (job: Job) => {
        const emailOptions: MailerOptions = job.data;
        console.log(emailOptions);
        try {
            await transporter.sendMail(emailOptions);
            logger.info(`Email sent successfully by job id: ${job.id}`);
        } catch (error) {
            logger.error(`Failed to send email by job id: ${job.id}`);
            logger.error(error);
        }
    },
};

export default workers;
