"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceTypeAndModel = void 0;
const ua_parser_js_1 = require("ua-parser-js");
const getDeviceTypeAndModel = (uaString) => {
    const parser = new ua_parser_js_1.UAParser(uaString);
    const result = parser.getResult();
    let type = result.device.type;
    let model = result.device.model;
    const osName = result.os.name || "";
    if (!type) {
        if (/Windows|Mac OS|Linux|Ubuntu|Debian|Fedora|Chrome OS/.test(osName)) {
            type = "desktop";
        }
        else if (/Android|iOS/.test(osName)) {
            type = "mobile"; // Fallback
        }
        else {
            type = "unknown";
        }
    }
    if (!model && type === "desktop") {
        if (osName.includes("Windows")) {
            model = "Windows PC";
        }
        else if (osName.includes("Mac")) {
            model = "Macintosh";
        }
        else if (osName.includes("Linux")) {
            model = "Linux Desktop";
        }
    }
    return {
        type,
        model: model || "unknown",
    };
};
exports.getDeviceTypeAndModel = getDeviceTypeAndModel;
const uaParserMiddleware = (req, res, next) => {
    const userAgent = req.headers["user-agent"] || "";
    try {
        const parser = new ua_parser_js_1.UAParser(userAgent);
        const result = parser.getResult();
        const uaData = {
            browser: {
                name: result.browser.name || "unknown",
                version: result.browser.version || "unknown",
            },
            os: {
                name: result.os.name || "unknown",
                version: result.os.version || "unknown",
            },
            device: {
                type: result.device.type || "unknown",
                model: result.device.model || "unknown",
            },
        };
        if (uaData.device.type === "unknown" || uaData.device.model === "unknown") {
            const deviceInfo = (0, exports.getDeviceTypeAndModel)(userAgent);
            uaData.device.type = deviceInfo.type;
            uaData.device.model = deviceInfo.model;
        }
        if (!req.meta) {
            req.meta = {};
        }
        req.meta.uaInfo = uaData;
        next();
    }
    catch (error) {
        req.meta.uaInfo = {
            browser: { name: "unknown", version: "unknown" },
            os: { name: "unknown", version: "unknown" },
            device: { type: "unknown", model: "unknown" },
        };
        next();
    }
};
exports.default = uaParserMiddleware;
