import sendResponse from "@utils/sendResponse";
import { Request, Response, NextFunction } from "express";

const globalErrorHandler = (
    err: { statusCode?: number; message?: string },
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    void _next;
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong!";

    return sendResponse(res, {
        success: false,
        statusCode,
        message,
    });
};

export default globalErrorHandler;
