import type { Response } from "express";
import Statuscodes from "http-status-codes";

interface ApiResponse {
    success: boolean;
    statusCode: number;
    message: string;
    [data: string]: unknown;
}

interface Input {
    success?: boolean;
    message: string;
    statusCode?: number;
    [data: string]: unknown;
}

const sendResponse = (
    res: Response,
    { message, statusCode = Statuscodes.OK, success = true, ...other }: Input
) => {
    const resonse: ApiResponse = {
        success,
        statusCode,
        message,
        ...other,
    };
    return res.status(statusCode).json(resonse);
};
