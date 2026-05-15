"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.yjsWss = void 0;
exports.syncDockerToYjs = syncDockerToYjs;
const ws_1 = require("ws");
// @ts-ignore
const utils_1 = require("y-websocket/bin/utils");
const lodash_1 = require("lodash");
const dockerManager_1 = __importDefault(require("../services/dockerManager"));
const logger_1 = __importDefault(require("../utils/logger"));
const fast_diff_1 = __importDefault(require("fast-diff"));
exports.yjsWss = new ws_1.WebSocketServer({ noServer: true });
const syncLocks = new Set();
exports.yjsWss.on("connection", (ws, req) => {
    const rawUrl = req.url?.slice(1) || "";
    const roomName = decodeURIComponent(rawUrl);
    (0, utils_1.setupWSConnection)(ws, req, { docName: roomName });
    const match = roomName.match(/^([^-]+)-(.*)$/);
    if (!match)
        return;
    const [_, projectId, filePath] = match;
    const correctProjectId = projectId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
    const docs = require("y-websocket/bin/utils").docs;
    const ydoc = docs.get(roomName);
    if (!ydoc) {
        return;
    }
    if (ydoc) {
        const ytext = ydoc.getText("codemirror");
        if (!ydoc.isInitialized) {
            ydoc.isInitialized = true;
            dockerManager_1.default.getFileContent(correctProjectId, filePath)
                .then((initialContent) => {
                if (ytext.length === 0 && initialContent) {
                    ytext.insert(0, initialContent);
                }
            })
                .catch((err) => logger_1.default.error(`Failed to load initial file: ${filePath}`, err));
        }
        const saveToDocker = (0, lodash_1.debounce)(async () => {
            const currentText = ytext.toString();
            try {
                await dockerManager_1.default.writeFileToContainer(correctProjectId, filePath, currentText);
            }
            catch (err) {
                logger_1.default.error(`Docker write failed for ${filePath}`);
                logger_1.default.error(err);
            }
        }, 1000);
        ydoc.on("update", (update, origin) => {
            if (origin === "backend-sync") {
                return;
            }
            saveToDocker();
        });
    }
});
async function syncDockerToYjs(projectId, filePath) {
    const correctProjectId = projectId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
    const roomName = `${projectId}-${filePath}`;
    if (syncLocks.has(roomName)) {
        return;
    }
    syncLocks.add(roomName);
    const docs = require("y-websocket/bin/utils").docs;
    const ydoc = docs.get(roomName);
    if (!ydoc)
        return;
    const ytext = ydoc.getText("codemirror");
    const oldContent = ytext.toString();
    try {
        const containerFileContent = await dockerManager_1.default.getFileContent(correctProjectId, filePath);
        if (containerFileContent === null)
            return;
        const newContent = containerFileContent.replace(/\r/g, "");
        if (oldContent == newContent) {
            return;
        }
        const changes = (0, fast_diff_1.default)(oldContent, newContent);
        let index = 0;
        ydoc.transact(() => {
            changes.forEach(([action, text]) => {
                if (action === fast_diff_1.default.EQUAL) {
                    index += text.length;
                }
                else if (action === fast_diff_1.default.DELETE) {
                    ytext.delete(index, text.length);
                }
                else if (action === fast_diff_1.default.INSERT) {
                    ytext.insert(index, text);
                    index += text.length;
                }
            });
        }, "backend-sync");
    }
    catch (error) {
        logger_1.default.error(`Failed to sync Docker content for ${filePath}`);
        logger_1.default.error(error);
    }
    finally {
        await new Promise((resolve) => setTimeout(() => {
            syncLocks.delete(roomName);
            resolve(null);
        }, 500));
    }
}
