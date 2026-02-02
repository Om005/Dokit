import { Request } from "express";

interface RequestData {
    clientIp?: string;
    geoInfo?: {
        city: string;
        region: string;
        country: string;
    };
    uaInfo?: {
        browser: {
            name: string | null;
            version: string | null;
        };
        os: {
            name: string | null;
            version: string | null;
        };
        device: {
            type: string | null;
            model: string | null;
        };
    };
    user?: {
        id: string;
        email: string;
        sessionId: string;
    };
}

declare global {
    namespace Express {
        interface Request {
            meta: RequestData;
        }
    }
}
