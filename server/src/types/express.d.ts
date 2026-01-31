import { Request } from "express";

interface RequestData {
    clientIp?: string;
}

declare global {
    namespace Express {
        interface Request {
            meta: RequestData;
        }
    }
}
