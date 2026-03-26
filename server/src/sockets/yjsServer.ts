import { WebSocketServer } from "ws";
// @ts-ignore
import { setupWSConnection } from "y-websocket/bin/utils";
import * as Y from "yjs";
import { debounce } from "lodash";
import DockerManager from "services/dockerManager";
import logger from "@utils/logger";
import diff from "fast-diff";

export const yjsWss = new WebSocketServer({ noServer: true });

const syncLocks = new Set<string>();

yjsWss.on("connection", (ws, req) => {
    const roomName = req.url?.slice(1) || "";

    setupWSConnection(ws, req, { docName: roomName });

    const match = roomName.match(/^([^-]+)-(.*)$/);
    if (!match) return;
    const [_, projectId, filePath] = match;
    const correctProjectId = projectId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
    const docs = require("y-websocket/bin/utils").docs;
    const ydoc: Y.Doc = docs.get(roomName);
    if (!ydoc) {
        return;
    }

    if (ydoc) {
        const ytext = ydoc.getText("codemirror");
        if (!(ydoc as any).isInitialized) {
            (ydoc as any).isInitialized = true;

            DockerManager.getFileContent(correctProjectId, filePath)
                .then((initialContent) => {
                    if (ytext.length === 0 && initialContent) {
                        ytext.insert(0, initialContent);
                    }
                })
                .catch((err) => logger.error(`Failed to load initial file: ${filePath}`, err));
        }
        const saveToDocker = debounce(async () => {
            const currentText = ytext.toString();
            try {
                await DockerManager.writeFileToContainer(correctProjectId, filePath, currentText);
            } catch (err) {
                logger.error(`Docker write failed for ${filePath}`);
                logger.error(err);
            }
        }, 1000);

        ydoc.on("update", (update: Uint8Array, origin: any) => {
            if (origin === "backend-sync") {
                return;
            }
            saveToDocker();
        });
    }
});

export async function syncDockerToYjs(projectId: string, filePath: string) {
    const correctProjectId = projectId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
    const roomName = `${projectId}-${filePath}`;

    if (syncLocks.has(roomName)) {
        return;
    }
    syncLocks.add(roomName);
    const docs = require("y-websocket/bin/utils").docs;
    const ydoc: Y.Doc = docs.get(roomName);

    if (!ydoc) return;

    const ytext = ydoc.getText("codemirror");
    const oldContent = ytext.toString();

    try {
        const containerFileContent = await DockerManager.getFileContent(correctProjectId, filePath);
        if (containerFileContent === null) return;
        const newContent = containerFileContent.replace(/\r/g, "");

        if (oldContent == newContent) {
            return;
        }

        const changes = diff(oldContent, newContent);
        let index = 0;

        ydoc.transact(() => {
            changes.forEach(([action, text]) => {
                if (action === diff.EQUAL) {
                    index += text.length;
                } else if (action === diff.DELETE) {
                    ytext.delete(index, text.length);
                } else if (action === diff.INSERT) {
                    ytext.insert(index, text);
                    index += text.length;
                }
            });
        }, "backend-sync");
    } catch (error) {
        logger.error(`Failed to sync Docker content for ${filePath}`);
        logger.error(error);
    } finally {
        await new Promise((resolve) =>
            setTimeout(() => {
                syncLocks.delete(roomName);
                resolve(null);
            }, 500)
        );
    }
}
