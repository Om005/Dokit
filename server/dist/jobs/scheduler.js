"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const node_cron_1 = __importDefault(require("node-cron"));
const dockerManager_1 = __importDefault(require("../services/dockerManager"));
const initializeScheduler = () => {
    node_cron_1.default.schedule("*/15 * * * *", async () => {
        try {
            await dockerManager_1.default.cleanupOldContainers();
        }
        catch (error) {
            logger_1.default.error("Error running scheduled container cleanup:");
            logger_1.default.error(error);
        }
    });
    node_cron_1.default.schedule("0 * * * *", async () => {
        try {
            await dockerManager_1.default.syncAllcontainersToR2();
        }
        catch (error) {
            logger_1.default.error("Error running scheduled sync to R2:");
            logger_1.default.error(error);
        }
    });
};
exports.default = initializeScheduler;
