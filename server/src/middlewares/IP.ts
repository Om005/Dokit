import { Request, Response, NextFunction } from "express";
import { isIP } from "net";

const extractIpMiddleware = (req: Request, res: Response, next: NextFunction) => {
    let ip: string = "";

    const cfIp = req.headers["cf-connecting-ip"];

    const xForwardedFor = req.headers["x-forwarded-for"];

    const xRealIp = req.headers["x-real-ip"];

    if (typeof cfIp === "string") {
        ip = cfIp;
    } else if (typeof xForwardedFor === "string") {
        ip = xForwardedFor.split(",")[0].trim();
    } else if (typeof xRealIp === "string") {
        ip = xRealIp;
    } else if (req.socket.remoteAddress) {
        ip = req.socket.remoteAddress;
    }

    if (ip.startsWith("::ffff:")) {
        ip = ip.substring(7);
    }
    if (ip === "::1" || !isIP(ip)) {
        ip = "127.0.0.1";
    }
    if (!req.meta) {
        req.meta = {};
    }
    req.meta.clientIp = ip;
    next();
};

export default extractIpMiddleware;
