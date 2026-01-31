import type { Request, Response } from "express";
import { transporter, MailerOptions } from "@config/mailer";
import env from "@config/env";

const controllers = {
    sendOtpForAccountCreation: async (req: Request, res: Response) => {},
};

export default controllers;
