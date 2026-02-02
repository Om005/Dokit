import logger from "@utils/logger";
import sendResponse from "@utils/sendResponse";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodSchema } from "zod";

const validationMiddleware = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        let result;
        try {
            result = schema.safeParse(req.body);
            if (!result.success) {
                const message = JSON.parse(result.error.message)[0].message;
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: message || "Invalid request",
                });
            } else {
                next();
            }
        } catch (error) {
            logger.error("Validation Middleware Error:");
            logger.error(error);
            next(error);
        }
    };
};

export default validationMiddleware;
