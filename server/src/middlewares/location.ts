import fs from "fs";
import path from "path";
import maxmind, { Reader, CityResponse } from "maxmind";
import logger from "@utils/logger";
import { Response, Request, NextFunction } from "express";

export interface LocationData {
    city: string;
    region: string;
    country: string;
}

let reader: Reader<CityResponse> | null = null;
const DB_PATH = path.resolve(process.cwd(), "geoip", "GeoLite2-City.mmdb");

export const initGeoIP = async () => {
    if (reader) return;

    if (!fs.existsSync(DB_PATH)) {
        logger.warn(`GeoIP DB not found at ${DB_PATH}`);
        return;
    }

    try {
        reader = await maxmind.open<CityResponse>(DB_PATH);
        logger.info("GeoIP database loaded successfully");
    } catch (error) {
        logger.error("Failed to load GeoIP database:");
        logger.error(error);
    }
};

export const getGeoInfo = (ip: string): LocationData | null => {
    if (!reader) return null;

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
        if (!response) return null;

        return {
            city: response.city?.names?.en || "unknown",
            region: response.subdivisions?.[0]?.names?.en || "unknown",
            country: response.country?.names?.en || "unknown",
        };
    } catch (error) {
        return null;
    }
};

export const locationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!req.meta) {
        req.meta = {};
    }
    const ip = req.meta?.clientIp;
    if (ip && reader) {
        const geoInfo = getGeoInfo(ip);
        if (geoInfo) {
            req.meta.geoInfo = geoInfo;
        }
    }
    next();
};
