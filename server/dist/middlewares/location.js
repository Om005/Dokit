"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationMiddleware = exports.getGeoInfo = exports.initGeoIP = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const maxmind_1 = __importDefault(require("maxmind"));
const logger_1 = __importDefault(require("../utils/logger"));
let reader = null;
const DB_PATH = path_1.default.resolve(process.cwd(), "geoip", "GeoLite2-City.mmdb");
const initGeoIP = async () => {
    if (reader)
        return;
    if (!fs_1.default.existsSync(DB_PATH)) {
        logger_1.default.warn(`GeoIP DB not found at ${DB_PATH}`);
        return;
    }
    try {
        reader = await maxmind_1.default.open(DB_PATH);
        logger_1.default.info("GeoIP database loaded successfully");
    }
    catch (error) {
        logger_1.default.error("Failed to load GeoIP database:");
        logger_1.default.error(error);
    }
};
exports.initGeoIP = initGeoIP;
const getGeoInfo = (ip) => {
    if (!reader)
        return null;
    try {
        const cleanIp = ip.replace(/^::ffff:/, "");
        if (cleanIp === "127.0.0.1" || cleanIp === "::1") {
            return {
                city: "Localhost",
                region: "Localhost",
                country: "Localhost",
            };
        }
        const response = reader.get(cleanIp);
        if (!response)
            return null;
        return {
            city: response.city?.names?.en || "unknown",
            region: response.subdivisions?.[0]?.names?.en || "unknown",
            country: response.country?.names?.en || "unknown",
        };
    }
    catch (error) {
        return null;
    }
};
exports.getGeoInfo = getGeoInfo;
const locationMiddleware = (req, res, next) => {
    if (!req.meta) {
        req.meta = {};
    }
    const ip = req.meta?.clientIp;
    if (ip && reader) {
        const geoInfo = (0, exports.getGeoInfo)(ip);
        if (geoInfo) {
            req.meta.geoInfo = geoInfo;
        }
    }
    next();
};
exports.locationMiddleware = locationMiddleware;
