"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = require("net");
const isLocalIp = (ip) => {
    if (!ip) {
        return false;
    }
    return (ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        (ip.startsWith("172.") &&
            (() => {
                const second = Number(ip.split(".")[1]);
                return second >= 16 && second <= 31;
            })()) ||
        ip === "::1" ||
        ip === "127.0.0.1" ||
        ip.startsWith("fc") ||
        ip.startsWith("fd"));
};
const extractIpMiddleware = (req, res, next) => {
    let ip = "";
    const cfIp = req.headers["cf-connecting-ip"];
    const xForwardedFor = req.headers["x-forwarded-for"];
    const xRealIp = req.headers["x-real-ip"];
    if (typeof cfIp === "string") {
        ip = cfIp;
    }
    else if (typeof xForwardedFor === "string") {
        ip = xForwardedFor.split(",")[0].trim();
    }
    else if (typeof xRealIp === "string") {
        ip = xRealIp;
    }
    else if (req.socket.remoteAddress) {
        ip = req.socket.remoteAddress;
    }
    if (ip.startsWith("::ffff:")) {
        ip = ip.substring(7);
    }
    if (isLocalIp(ip) || !(0, net_1.isIP)(ip)) {
        ip = "8.8.8.8";
    }
    if (!req.meta) {
        req.meta = {};
    }
    req.meta.clientIp = ip;
    next();
};
exports.default = extractIpMiddleware;
