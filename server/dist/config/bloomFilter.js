"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userNameBloomFilter = exports.BloomFilter = void 0;
exports.initializeBloomFilter = initializeBloomFilter;
const prisma_1 = require("../db/prisma");
const redisClient_1 = require("./redisClient");
const logger_1 = __importDefault(require("../utils/logger"));
class BloomFilter {
    key = "bf:usernames";
    errorRate = 0.01;
    capacity = 1000000;
    constructor() {
        this.initializeBloomFilter();
    }
    async initializeBloomFilter() {
        try {
            const exists = await redisClient_1.redisClient.exists(this.key);
            if (!exists) {
                await redisClient_1.redisClient.sendCommand([
                    "BF.RESERVE",
                    this.key,
                    this.errorRate.toString(),
                    this.capacity.toString(),
                ]);
                logger_1.default.info("Bloom filter initialized");
            }
            else {
                logger_1.default.info("Bloom filter already exists");
            }
        }
        catch (error) {
            logger_1.default.error("Error initializing bloom filter");
            logger_1.default.error(error);
        }
    }
    async addUsername(username) {
        try {
            const normalizedUsername = username.trim();
            const result = (await redisClient_1.redisClient.sendCommand([
                "BF.ADD",
                this.key,
                normalizedUsername,
            ]));
            return result === 1;
        }
        catch (error) {
            logger_1.default.error("Error adding username to bloom filter");
            logger_1.default.error(error);
            return false;
        }
    }
    async addMultipleUsernames(usernames) {
        try {
            const normalizedUsernames = usernames.map((username) => username.trim());
            const result = (await redisClient_1.redisClient.sendCommand([
                "BF.MADD",
                this.key,
                ...normalizedUsernames,
            ]));
            return result;
        }
        catch (error) {
            logger_1.default.error("Error adding multiple usernames to bloom filter");
            logger_1.default.error(error);
            return [];
        }
    }
    async mightExist(username) {
        try {
            const normalizedUsername = username.trim();
            const result = (await redisClient_1.redisClient.sendCommand([
                "BF.EXISTS",
                this.key,
                normalizedUsername,
            ]));
            return result === 1;
        }
        catch (error) {
            logger_1.default.error("Error checking username existence in bloom filter");
            logger_1.default.error(error);
            return false;
        }
    }
    async getInfo() {
        try {
            const info = (await redisClient_1.redisClient.sendCommand(["BF.INFO", this.key]));
            const infoObj = {};
            for (let i = 0; i < info.length; i += 2) {
                infoObj[info[i]] = info[i + 1];
            }
            return {
                capacity: infoObj["Capacity"] || 0,
                size: infoObj["Size"] || 0,
                numberOfFilters: infoObj["Number of filters"] || 0,
                numberOfItemsInserted: infoObj["Number of items inserted"] || 0,
                expansionRate: infoObj["Expansion rate"] || 0,
            };
        }
        catch (error) {
            logger_1.default.error("Error getting bloom filter info:");
            logger_1.default.error(error);
            throw error;
        }
    }
    async reset() {
        try {
            await redisClient_1.redisClient.del(this.key);
            await this.initializeBloomFilter();
            logger_1.default.info("Bloom filter reset");
        }
        catch (error) {
            logger_1.default.error("Error resetting bloom filter:");
            logger_1.default.error(error);
            throw error;
        }
    }
    async populateWithUsernames() {
        try {
            const batchSize = 1000;
            let cursor = undefined;
            let totalAdded = 0;
            do {
                const users = await prisma_1.prisma.user.findMany({
                    take: batchSize,
                    skip: cursor ? 1 : 0,
                    cursor: cursor ? { id: cursor } : undefined,
                    select: { username: true, id: true },
                });
                if (users.length === 0)
                    break;
                const usernames = users.map((user) => user.username);
                const addResults = await this.addMultipleUsernames(usernames);
                totalAdded += users.length;
                cursor = users[users.length - 1].id;
            } while (cursor);
            logger_1.default.info(`Bloom filter populated with ${totalAdded} usernames`);
        }
        catch (error) {
            logger_1.default.error("Error populating Bloom filter:");
            logger_1.default.error(error);
        }
    }
}
exports.BloomFilter = BloomFilter;
const userNameBloomFilter = new BloomFilter();
exports.userNameBloomFilter = userNameBloomFilter;
async function initializeBloomFilter() {
    try {
        await userNameBloomFilter.populateWithUsernames();
    }
    catch (error) {
        logger_1.default.error("Error initializing Bloom filter:");
        logger_1.default.error(error);
    }
}
