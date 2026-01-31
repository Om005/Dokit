import axios from "axios";
import logger from "@utils/logger";
import env from "@config/env";

interface MailerOptions {
    from: string;
    to: string;
    subject: string;
    htmlContent: string;
}

const brevoClient = axios.create({
    baseURL: "https://api.brevo.com/v3",
    headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
    },
});

const transporter = {
    sendMail: async ({ from, to, subject, htmlContent }: MailerOptions) => {
        try {
            await brevoClient.post("/smtp/email", {
                sender: {
                    email: from,
                },
                subject: subject,
                to: [
                    {
                        email: to,
                    },
                ],
                htmlContent: htmlContent,
            });
        } catch (error) {
            logger.error("Failed to send email");
            logger.error(error);
        }
    },
    verify: async (): Promise<boolean> => {
        try {
            await brevoClient.get("/account");
            return true;
        } catch (error) {
            return false;
        }
    },
};

const verifyTransporter = async () => {
    const verified = await transporter.verify();
    if (verified) {
        logger.info("Email service configured correctly");
    } else {
        logger.error("Email service configuration failed");
    }
};

export { transporter, verifyTransporter, MailerOptions };
