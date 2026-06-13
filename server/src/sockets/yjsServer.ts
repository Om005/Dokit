import { WebSocketServer } from "ws";
// @ts-expect-error - y-websocket/bin/utils does not ship proper TS types
import * as yUtils from "y-websocket/bin/utils";
import * as Y from "yjs";
import { debounce } from "lodash";
import DockerManager from "services/dockerManager";
import logger from "@utils/logger";
import diff from "fast-diff";
import queueActions from "@modules/queue/queueActions";
import { IGNORED_DIRECTORIES } from "@modules/queue/workerActions";

export const yjsWss = new WebSocketServer({ noServer: true });

const syncLocks = new Set<string>();
const initializedDocs = new Set<string>();

function toCorrectProjectId(projectId: string) {
    return projectId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
}

yjsWss.on("connection", (ws, req) => {
    const rawUrl = req.url?.slice(1) || "";
    const roomName = decodeURIComponent(rawUrl);

    yUtils.setupWSConnection(ws, req, { docName: roomName });

    const match = roomName.match(/^([^-]+)-(.*)$/);
    if (!match) return;

    const [, projectId, filePath] = match;
    const correctProjectId = toCorrectProjectId(projectId);

    const ydoc = yUtils.docs.get(roomName) as Y.Doc | undefined;
    if (!ydoc) return;

    const ytext = ydoc.getText("codemirror");

    if (!initializedDocs.has(roomName)) {
        initializedDocs.add(roomName);

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
            const parts = filePath.split("/");
            if (parts.some((part) => IGNORED_DIRECTORIES.has(part))) {
                return;
            }
            queueActions.addUpdateEmbeddingsJob(correctProjectId, filePath, currentText);
        } catch (err) {
            logger.error(`Docker write failed for ${filePath}`);
            logger.error(err);
        }
    }, 1000);

    ydoc.on("update", (_update: Uint8Array, origin: unknown) => {
        if (origin === "backend-sync") {
            return;
        }
        saveToDocker();
    });
});

export async function syncDockerToYjs(projectId: string, filePath: string) {
    const correctProjectId = toCorrectProjectId(projectId);
    const roomName = `${projectId}-${filePath}`;

    if (syncLocks.has(roomName)) {
        return;
    }

    syncLocks.add(roomName);

    const ydoc = yUtils.docs.get(roomName) as Y.Doc | undefined;
    if (!ydoc) {
        syncLocks.delete(roomName);
        return;
    }

    const ytext = ydoc.getText("codemirror");
    const oldContent = ytext.toString();

    try {
        const containerFileContent = await DockerManager.getFileContent(correctProjectId, filePath);
        if (containerFileContent === null) return;

        const newContent = containerFileContent.replace(/\r/g, "");

        if (oldContent === newContent) {
            return;
        }

        const changes = diff(oldContent, newContent);
        let index = 0;

        ydoc.transact(() => {
            for (const [action, text] of changes) {
                if (action === diff.EQUAL) {
                    index += text.length;
                } else if (action === diff.DELETE) {
                    ytext.delete(index, text.length);
                } else if (action === diff.INSERT) {
                    ytext.insert(index, text);
                    index += text.length;
                }
            }
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
