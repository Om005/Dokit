import { prisma } from "@db/prisma";
import { redisClient } from "./redisClient";
import logger from "@utils/logger";

export class BloomFilter {
    private readonly key: string = "bf:usernames";
    private readonly errorRate: number = 0.01;
    private readonly capacity: number = 1000000;

    constructor() {
        this.initializeBloomFilter();
    }

    private async initializeBloomFilter() {
        try {
            const exists = await redisClient.exists(this.key);
            if (!exists) {
                await redisClient.sendCommand([
                    "BF.RESERVE",
                    this.key,
                    this.errorRate.toString(),
                    this.capacity.toString(),
                ]);
                logger.info("Bloom filter initialized");
            } else {
                logger.info("Bloom filter already exists");
            }
        } catch (error) {
            logger.error("Error initializing bloom filter");
            logger.error(error);
        }
    }

    async addUsername(username: string): Promise<boolean> {
        try {
            const normalizedUsername = username.trim();
            const result = (await redisClient.sendCommand([
                "BF.ADD",
                this.key,
                normalizedUsername,
            ])) as number;
            return result === 1;
        } catch (error) {
            logger.error("Error adding username to bloom filter");
            logger.error(error);
            return false;
        }
    }

    async addMultipleUsernames(usernames: string[]): Promise<number[]> {
        try {
            const normalizedUsernames = usernames.map((username) => username.trim());
            const result = (await redisClient.sendCommand([
                "BF.MADD",
                this.key,
                ...normalizedUsernames,
            ])) as number[];

            return result;
        } catch (error) {
            logger.error("Error adding multiple usernames to bloom filter");
            logger.error(error);
            return [];
        }
    }

    async mightExist(username: string): Promise<boolean> {
        try {
            const normalizedUsername = username.trim();
            const result = (await redisClient.sendCommand([
                "BF.EXISTS",
                this.key,
                normalizedUsername,
            ])) as number;
            return result === 1;
        } catch (error) {
            logger.error("Error checking username existence in bloom filter");
            logger.error(error);
            return false;
        }
    }

    async getInfo(): Promise<{
        capacity: number;
        size: number;
        numberOfFilters: number;
        numberOfItemsInserted: number;
        expansionRate: number;
    }> {
        try {
            const info = (await redisClient.sendCommand(["BF.INFO", this.key])) as any[];

            const infoObj: any = {};
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
        } catch (error) {
            logger.error("Error getting bloom filter info:");
            logger.error(error);
            throw error;
        }
    }

    async reset(): Promise<void> {
        try {
            await redisClient.del(this.key);
            await this.initializeBloomFilter();
            logger.info("Bloom filter reset");
        } catch (error) {
            logger.error("Error resetting bloom filter:");
            logger.error(error);
            throw error;
        }
    }

    async populateWithUsernames(): Promise<void> {
        try {
            const batchSize = 1000;
            let cursor: string | undefined = undefined;
            let totalAdded = 0;

            do {
                const users: { username: string; id: string }[] = await prisma.user.findMany({
                    take: batchSize,
                    skip: cursor ? 1 : 0,
                    cursor: cursor ? { id: cursor } : undefined,
                    select: { username: true, id: true },
                });

                if (users.length === 0) break;

                const usernames = users.map((user) => user.username);
                const addResults = await this.addMultipleUsernames(usernames);
                totalAdded += users.length;

                cursor = users[users.length - 1].id;
            } while (cursor);

            logger.info(`Bloom filter populated with ${totalAdded} usernames`);
        } catch (error) {
            logger.error("Error populating Bloom filter:");
            logger.error(error);
        }
    }
}
const userNameBloomFilter = new BloomFilter();

async function initializeBloomFilter() {
    try {
        await userNameBloomFilter.populateWithUsernames();
    } catch (error) {
        logger.error("Error initializing Bloom filter:");
        logger.error(error);
    }
}

export { userNameBloomFilter, initializeBloomFilter };
