"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
if (process.env.NODE_ENV === "production") {
    require("module-alias/register");
}
const express_1 = __importDefault(require("express"));
const env_1 = __importDefault(require("./config/env"));
const checkEnv_1 = require("./config/checkEnv");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./modules/auth/routes"));
const routes_2 = __importDefault(require("./modules/account/routes"));
const routes_3 = __importDefault(require("./modules/project/routes"));
const routes_4 = __importDefault(require("./modules/editor/routes"));
const access_routes_1 = __importDefault(require("./modules/project/access.routes"));
const httpLogger_1 = __importDefault(require("./middlewares/httpLogger"));
const IP_1 = __importDefault(require("./middlewares/IP"));
const mailer_1 = require("./config/mailer");
const workers_1 = __importDefault(require("./modules/queue/workers"));
const redisClient_1 = require("./config/redisClient");
const globalErrorHandler_1 = __importDefault(require("./middlewares/globalErrorHandler"));
const prisma_1 = require("./db/prisma");
const location_1 = require("./middlewares/location");
const bloomFilter_1 = require("./config/bloomFilter");
const scheduler_1 = __importDefault(require("./jobs/scheduler"));
const http_1 = require("http");
const yjsServer_1 = require("./sockets/yjsServer");
const socket_io_1 = require("socket.io");
const projectSocket_1 = __importDefault(require("./sockets/projectSocket"));
(0, checkEnv_1.checkEnv)();
(0, prisma_1.connectToDatabase)();
(0, mailer_1.verifyTransporter)();
(0, workers_1.default)();
(0, location_1.initGeoIP)();
(0, redisClient_1.connectRedis)();
(0, bloomFilter_1.initializeBloomFilter)();
const app = (0, express_1.default)();
app.set("trust proxy", true);
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.default.FRONTEND_URL,
    credentials: true,
}));
app.use(httpLogger_1.default);
app.use(IP_1.default);
app.use(globalErrorHandler_1.default);
app.use("/api/auth", routes_1.default);
app.use("/api/account", routes_2.default);
app.use("/api/project/access", access_routes_1.default);
app.use("/api/project", routes_3.default);
app.use("/api/editor", routes_4.default);
const httpServer = (0, http_1.createServer)(app);
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: env_1.default.FRONTEND_URL,
        credentials: true,
    },
});
(0, projectSocket_1.default)(exports.io);
httpServer.on("upgrade", (request, socket, head) => {
    const pathname = request.url || "";
    if (pathname.startsWith("/socket.io/")) {
        return;
    }
    yjsServer_1.yjsWss.handleUpgrade(request, socket, head, (ws) => {
        yjsServer_1.yjsWss.emit("connection", ws, request);
    });
});
const PORT = env_1.default.PORT;
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    (0, scheduler_1.default)();
});
