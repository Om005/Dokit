import type { Request, Response } from "express";
import { transporter, MailerOptions } from "@config/mailer";
import env from "@config/env";

export const fn = (req: Request, res: Response) => {
    try {
        const mailer: MailerOptions = {
            to: "chavdaom84@gmail.com",
            from: env.SENDER_EMAIL,
            subject: "Test Mail",
            htmlContent: "<h1>This is a test mail</h1>",
        };
        transporter.sendMail(mailer);
        res.status(200).json({ message: "Mail sent successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to send mail" });
    }
};
