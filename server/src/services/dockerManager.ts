import Docker from "dockerode";
import { ProjectStack } from "@generated/prisma";
import logger from "@utils/logger";
import env from "@config/env";
import queueActions from "@modules/queue/queueActions";
import { prisma } from "@db/prisma";
import { PassThrough } from "stream";
import { FileNode } from "types/express";
import { syncDockerToYjs } from "sockets/yjsServer";
import { io } from "index";

const docker = new Docker();

const NETWORK = "dokit-network";

interface DockerError extends Error {
    statusCode?: number;
    reason?: string;
}

interface DokitContainer {
    id: string;
    name: string;
    state: string;
    created: Date;
}

const syncLocks = new Set<string>();

async function waitForContainerReady(containerId: string, timeoutMs = 60_000): Promise<void> {
    const container = docker.getContainer(containerId);

    const logStream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        timestamps: false,
    });

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            logStream.destroy();
            reject(
                new Error(`Container ${containerId} did not become ready within ${timeoutMs}ms`)
            );
        }, timeoutMs);

        logStream.on("data", (chunk: Buffer) => {
            const line = chunk.toString("utf8");
            if (line.includes("CONTAINER_READY")) {
                clearTimeout(timer);
                logStream.destroy();
                resolve();
            }
        });

        logStream.on("error", (err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

async function createDokitContainer(
    projectId: string,
    stack: ProjectStack
): Promise<{ containerId: string | null; containerName: string }> {
    // const containerProjectId = projectId.replace(/-/g, "").slice(0, 12);
    const containerProjectId = projectId.replaceAll("-", "");
    const containerName = `dokit-${containerProjectId}`;
    const imageName = `dokit-${stack.toLowerCase()}:latest`;

    const existingContainer = docker.getContainer(containerName);

    try {
        const info = await existingContainer.inspect();

        if (!info.State.Running) {
            await existingContainer.start();
        }

        return { containerId: info.Id, containerName };
    } catch (error) {
        if ((error as DockerError).statusCode !== 404) {
            logger.error(`Error inspecting existing container ${containerName}:`);
            logger.error(error);
            return { containerId: null, containerName };
        }

        try {
            const container = await docker.createContainer({
                name: containerName,
                Image: imageName,
                Tty: true,
                OpenStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                ExposedPorts: { "7681/tcp": {} },
                Env: [
                    `PROJECT_ID=${projectId}`,
                    `R2_ACCESS_KEY_ID=${env.R2_ACCESS_KEY_ID}`,
                    `R2_SECRET_ACCESS_KEY=${env.R2_SECRET_ACCESS_KEY}`,
                    `R2_ACCOUNT_ID=${env.R2_ACCOUNT_ID}`,
                    `R2_BUCKET_NAME=${env.R2_BUCKET_NAME}`,
                ],
                HostConfig: {
                    NetworkMode: NETWORK,
                    AutoRemove: false,
                },
            });

            await container.start();
            await waitForContainerReady(container.id);

            // const containerInfo = await container.inspect();

            return { containerId: container.id, containerName };
        } catch (createError) {
            const dockerError = createError as DockerError;
            if (dockerError.statusCode === 409) {
                const raceContainer = docker.getContainer(containerName);
                const raceInfo = await raceContainer.inspect();
                return { containerId: raceInfo.Id, containerName };
            }
            logger.error(`Error creating or starting container ${containerName}:`);
            logger.error(dockerError);
            return { containerId: null, containerName };
        }
    }
}

async function deleteDokitContainer(projectId: string): Promise<boolean> {
    const containerProjectId = projectId.replaceAll("-", "");
    const containerName = `dokit-${containerProjectId}`;

    try {
        const container = docker.getContainer(containerName);
        await container.remove({ force: true });
        return true;
    } catch (error) {
        const dockerError = error as DockerError;
        if (dockerError.statusCode === 404) return true;

        logger.error(`Error deleting container ${containerName}:`);
        logger.error(dockerError);
        throw dockerError;
    }
}

async function listDokitContainers(): Promise<DokitContainer[]> {
    try {
        const containers = await docker.listContainers({
            all: true,
            filters: JSON.stringify({
                name: ["^/dokit-"],
            }),
        });

        return containers.map((c) => ({
            id: c.Id,
            name: c.Names[0].replace("/", ""),
            state: c.State,
            created: new Date(c.Created * 1000),
        }));
    } catch (error) {
        logger.error("Error listing Dokit containers:");
        logger.error(error);
        return [];
    }
}

async function cleanupOldContainers(): Promise<void> {
    try {
        const conainers = await listDokitContainers();
        const now = Date.now();
        const twoHrs = 2 * 60 * 60 * 1000;
        const fifteenMins = 15 * 60 * 1000;
        for (const container of conainers) {
            const projectId = container.name
                .replace("dokit-", "")
                .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
            const existingProject = await prisma.project.findUnique({ where: { id: projectId } });

            if (
                now - container.created.getTime() > twoHrs ||
                !existingProject ||
                existingProject.lastAccessedAt.getTime() < now - fifteenMins
            ) {
                queueActions.addContainerCleanupJob(projectId).catch((error) => {
                    logger.error(`Failed to add cleanup job for container ${container.name}:`);
                    logger.error(error);
                });
            }
        }
    } catch (error) {
        logger.error("Error cleaning up old Dokit containers:");
        logger.error(error);
        throw error;
    }
}

async function syncWorkspaceToR2(projectId: string): Promise<void> {
    try {
        const containerProjectId = projectId.replaceAll("-", "");
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);

        const rcloneCmd = `
                rclone sync /workspace/ r2:${env.R2_BUCKET_NAME}/code/${projectId}/ \\
                --create-empty-src-dirs \\
                --s3-directory-markers \\
                --exclude "node_modules/**" \\
                --exclude "dist/**" \\
                --exclude "build/**" \\
                --exclude "out/**" \\
                --exclude ".next/**" \\
                --exclude ".nuxt/**" \\
                --exclude ".svelte-kit/**" \\
                --exclude ".angular/**" \\
                --exclude ".cache/**" \\
                --exclude "coverage/**" \\
                --exclude "__pycache__/**" \\
                --exclude "*.py[cod]" \\
                --exclude "*\$py.class" \\
                --exclude "venv/**" \\
                --exclude ".venv/**" \\
                --exclude "env/**" \\
                --exclude ".pytest_cache/**" \\
                --exclude ".tox/**" \\
                --exclude "vendor/**" \\
                --exclude "target/**" \\
                --exclude "bin/**" \\
                --exclude "obj/**" \\
                --exclude ".gradle/**" \\
                --exclude "*.log" \\
                --exclude "npm-debug.log*" \\
                --exclude "yarn-error.log*" \\
                --exclude ".DS_Store" \\
                --exclude "Thumbs.db"
            `;
        const exec = await container.exec({
            Cmd: ["bash", "-c", rcloneCmd],
            AttachStdout: true,
            AttachStderr: true,
        });
        const stream = await exec.start({ hijack: true, stdin: false });
        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });
        const inspectResult = await exec.inspect();
        if (inspectResult.ExitCode !== 0) {
            logger.error(
                `Rclone sync failed for project ${projectId} with exit code ${inspectResult.ExitCode}`
            );
        } else {
            logger.info(`Rclone sync completed successfully for project ${projectId}`);
        }
    } catch (error) {
        logger.error(`Error syncing workspace to R2 for project ${projectId}:`);
        logger.error(error);
        throw error;
    }
}

async function syncAllcontainersToR2(): Promise<void> {
    try {
        const containers = await listDokitContainers();
        for (const container of containers) {
            const projectId = container.name
                .replace("dokit-", "")
                .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
            queueActions.addSyncToR2Job(projectId).catch((error) => {
                logger.error(`Failed to add sync to R2 job for container ${container.name}:`);
                logger.error(error);
            });
        }
    } catch (error) {
        logger.error("Error syncing all workspaces to R2:");
        logger.error(error);
        throw error;
    }
}

async function getFolderContent(
    projectId: string,
    folderPath: string
): Promise<Record<string, FileNode> | null> {
    try {
        const containerProjectId = projectId.replaceAll("-", "");
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);

        const targetPath = folderPath === "/" ? "/workspace" : `/workspace/${folderPath}`;
        const command = `find ${targetPath} -maxdepth 1 -mindepth 1 -not -name "*.git" -not -name "node_modules" -printf "%y|%f\\n"`;

        const exec = await container.exec({
            Cmd: ["bash", "-c", command],
            AttachStdout: true,
            AttachStderr: true,
        });

        const stream = await exec.start({ hijack: true, stdin: false });

        let output = "";

        const stdout = new PassThrough();
        const stderr = new PassThrough();

        container.modem.demuxStream(stream, stdout, stderr);

        stdout.on("data", (chunk) => {
            output += chunk.toString();
        });

        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });

        let nodes: Record<string, FileNode> = {};
        const lines = output.trim().split("\n");

        for (const line of lines) {
            const [nodeType, name] = line.split("|");
            if (!nodeType || !name) continue;

            const nodePath = folderPath === "/" ? `/${name}` : `${folderPath}/${name}`;
            nodes[nodePath] = {
                path: nodePath,
                name,
                type: nodeType === "d" ? "directory" : "file",
                code: null,
                children: [],
                isExpanded: false,
                isLoaded: false,
            };
        }
        return nodes;
    } catch (error) {
        logger.error(
            `Failed to get folder content for project ${projectId} and path ${folderPath}:`
        );
        logger.error(error);
        return null;
    }
}

async function getFileContent(projectId: string, filePath: string): Promise<string | null> {
    try {
        const containerProjectId = projectId.replaceAll("-", "");
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);

        const targetPath = `/workspace/${filePath}`;
        const command = `cat ${targetPath}`;

        const exec = await container.exec({
            Cmd: ["bash", "-c", command],
            AttachStdout: true,
            AttachStderr: true,
        });

        const stream = await exec.start({ hijack: true, stdin: false });
        let output = "";

        const stdout = new PassThrough();
        const stderr = new PassThrough();

        container.modem.demuxStream(stream, stdout, stderr);

        stdout.on("data", (chunk) => {
            output += chunk.toString();
        });

        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });

        return output.replace(/\r/g, "");
    } catch (error) {
        logger.error(`Failed to get file content for project ${projectId} and file ${filePath}:`);
        logger.error(error);
        return null;
    }
}

async function writeFileToContainer(
    projectId: string,
    filePath: string,
    content: string
): Promise<void> {
    try {
        const containerProjectId = projectId.replaceAll("-", "");
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);

        const targetPath = `/workspace/${filePath}`;

        const base64Content = Buffer.from(content).toString("base64");

        const command = `echo "${base64Content}" | base64 -d > ${targetPath}`;

        const exec = await container.exec({
            Cmd: ["bash", "-c", command],
            AttachStdout: true,
            AttachStderr: true,
        });

        const stream = await exec.start({ hijack: true, stdin: false });
        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });
    } catch (error) {
        logger.error(`Failed to write file content for project ${projectId} and file ${filePath}:`);
        logger.error(error);
        throw error;
    }
}

async function startFileSystemWatcher(projectId: string): Promise<void> {
    const containerProjectId = projectId.replaceAll("-", "");
    const containerName = `dokit-${containerProjectId}`;
    const excluded = [
        ".git",
        "node_modules",
        "dist",
        "build",
        "out",
        ".next",
        ".nuxt",
        ".svelte-kit",
        ".angular",
        ".cache",
        "coverage",
        "__pycache__",
        "venv",
        ".venv",
        "env",
        ".pytest_cache",
        ".tox",
        "vendor",
        "target",
        "bin",
        "obj",
        ".gradle",
    ];
    try {
        const container = await docker.getContainer(containerName);
        const command =
            "inotifywait -m -r -e close_write,create,delete,move --format '%e|%w%f' /workspace";
        const exec = await container.exec({
            Cmd: ["bash", "-c", command],
            AttachStdout: true,
            AttachStderr: true,
        });

        const stream = await exec.start({ hijack: true, stdin: false });

        const stdout = new PassThrough();
        const stderr = new PassThrough();

        container.modem.demuxStream(stream, stdout, stderr);

        stdout.on("data", (chunk) => {
            const output = chunk.toString().trim();
            const events = output.split("\n");
            let pendingEvent: string | null = null;
            events.forEach(async (event: string) => {
                const [action, filePath] = event.split("|");
                if (!filePath.startsWith("/workspace/")) return;
                if (excluded.some((ex) => filePath.startsWith(`${ex}/`))) return;
                if (excluded.some((ex) => filePath.includes(`/${ex}`))) return;
                const relativePath = filePath.replace("/workspace", "");
                const isDir = action.includes("ISDIR");

                if (action.includes("CLOSE_WRITE") || action.includes("MODIFY")) {
                    if (!isDir) {
                        syncDockerToYjs(containerProjectId, relativePath).catch((err) => {
                            logger.error(
                                `Failed to sync changed file ${relativePath} to Yjs for project ${containerProjectId}:`
                            );
                            logger.error(err);
                        });
                    }
                } else if (action.includes("CREATE")) {
                    if (
                        syncLocks.has(
                            `CREATE-${projectId}-${relativePath}-${isDir ? "dir" : "file"}`
                        )
                    ) {
                        return;
                    }
                    syncLocks.add(`CREATE-${projectId}-${relativePath}-${isDir ? "dir" : "file"}`);
                    io.to(projectId).emit("fs-change", {
                        action: "CREATE",
                        path: relativePath,
                        isDir: isDir,
                    });
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            syncLocks.delete(
                                `CREATE-${projectId}-${relativePath}-${isDir ? "dir" : "file"}`
                            );
                            resolve(null);
                        }, 3000);
                    });
                } else if (action.includes("DELETE")) {
                    io.to(projectId).emit("fs-change", {
                        action: "DELETE",
                        path: relativePath,
                        isDir: isDir,
                    });
                } else {
                    const [action, path] = event.split("|");
                    if (action.includes("MOVED_FROM")) {
                        pendingEvent = event;
                    } else if (action.includes("MOVED_TO") && pendingEvent) {
                        const [fromAction, fromPath] = pendingEvent.split("|");
                        pendingEvent = null;
                        const fromPathRelative = fromPath.replace("/workspace", "");
                        const isDir = action.includes("ISDIR");
                        const toPathRelative = path.replace("/workspace", "");
                        if (
                            syncLocks.has(
                                `MOVE-${projectId}-${fromPathRelative}-${toPathRelative}-${isDir ? "dir" : "file"}`
                            )
                        ) {
                            return;
                        }
                        syncLocks.add(
                            `MOVE-${projectId}-${fromPathRelative}-${toPathRelative}-${isDir ? "dir" : "file"}`
                        );
                        io.to(projectId).emit("fs-change", {
                            action: "RENAME",
                            fromPath: fromPathRelative,
                            toPath: toPathRelative,
                            isDir: isDir,
                        });
                        await new Promise((resolve) => {
                            setTimeout(() => {
                                syncLocks.delete(
                                    `MOVE-${projectId}-${fromPathRelative}-${toPathRelative}-${isDir ? "dir" : "file"}`
                                );
                                resolve(null);
                            }, 3000);
                        });
                    }
                }
            });

            stream.on("end", () => {
                logger.info(`File system watcher stream ended for project ${containerProjectId}`);
            });
        });
    } catch (error) {
        logger.error(`Failed to start file system watcher for project ${containerProjectId}:`);
        logger.error(error);
        throw error;
    }
}

async function createNode(projectId: string, nodePath: string, isDir: boolean): Promise<void> {
    const containerProjectId = projectId.replaceAll("-", "");
    try {
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);

        const cleanNodePath = nodePath.replace(/^\/+/, "");
        const targetPath = `/workspace/${cleanNodePath}`;
        if (targetPath.includes("..")) throw new Error("Invalid path: Path traversal detected");
        const command = `
            if [ -e "${targetPath}" ]; then
                exit 1
            fi
            ${isDir ? `mkdir -p "${targetPath}"` : `touch "${targetPath}"`}
        `;

        const exec = await container.exec({
            Cmd: ["bash", "-c", command],
            AttachStdout: true,
            AttachStderr: true,
        });

        const stream = await exec.start({ hijack: true, stdin: false });

        stream.resume();

        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });

        const inspectData = await exec.inspect();

        if (inspectData.ExitCode !== 0) {
            throw new Error(`${isDir ? "Folder" : "File"} already exists at path ${cleanNodePath}`);
        }
    } catch (error) {
        logger.error(`Failed to create node in container for project ${containerProjectId}:`);
        logger.error(error);
        throw error;
    }
}

async function deleteNode(projectId: string, nodePath: string): Promise<void> {
    const containerProjectId = projectId.replaceAll("-", "");
    try {
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);

        const cleanNodePath = nodePath.replace(/^\/+/, "");
        const targetPath = `/workspace/${cleanNodePath}`;

        if (targetPath.includes("..")) throw new Error("Invalid path: Path traversal detected");

        if (targetPath === "/workspace" || targetPath === "/workspace/") {
            throw new Error("Invalid operation: Cannot delete the root workspace directory");
        }
        const command = `rm -rf "${targetPath}"`;

        const exec = await container.exec({
            Cmd: ["bash", "-c", command],
            AttachStdout: true,
            AttachStderr: true,
        });

        const stream = await exec.start({ hijack: true, stdin: false });
        stream.resume();
        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });

        const inspectData = await exec.inspect();
        if (inspectData.ExitCode !== 0) {
            throw new Error(
                `Failed to delete node: ${cleanNodePath} (Exit Code: ${inspectData.ExitCode})`
            );
        }
    } catch (error) {
        logger.error(`Failed to delete node in container for project ${containerProjectId}:`);
        logger.error(error);
        throw error;
    }
}

async function renameNode(projectId: string, oldPath: string, newPath: string): Promise<void> {
    const containerProjectId = projectId.replaceAll("-", "");
    try {
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);

        const cleanOldPath = oldPath.replace(/^\/+/, "");
        const cleanNewPath = newPath.replace(/^\/+/, "");
        const targetOldPath = `/workspace/${cleanOldPath}`;
        const targetNewPath = `/workspace/${cleanNewPath}`;

        if (targetOldPath.includes("..") || targetNewPath.includes("..")) {
            throw new Error("Invalid path: Path traversal detected");
        }

        if (targetOldPath === "/workspace" || targetOldPath === "/workspace/") {
            throw new Error("Invalid operation: Cannot rename the root workspace");
        }

        const command = `
            if [ ! -e "${targetOldPath}" ]; then
                exit 1
            fi
            if [ -e "${targetNewPath}" ]; then
                exit 2
            fi
            mv "${targetOldPath}" "${targetNewPath}"
        `;

        const exec = await container.exec({
            Cmd: ["bash", "-c", command],
            AttachStdout: true,
            AttachStderr: true,
        });

        const stream = await exec.start({ hijack: true, stdin: false });

        stream.resume();

        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });

        const inspectData = await exec.inspect();
        if (inspectData.ExitCode === 1) {
            throw new Error(`Source file or folder does not exist: ${cleanOldPath}`);
        } else if (inspectData.ExitCode === 2) {
            throw new Error(`Destination name already taken: ${cleanNewPath}`);
        } else if (inspectData.ExitCode !== 0) {
            throw new Error(`Failed to rename node (Exit Code: ${inspectData.ExitCode})`);
        }
    } catch (error) {
        logger.error(`Failed to rename node in container for project ${containerProjectId}:`);
        logger.error(error);
        throw error;
    }
}

const DockerManager = {
    createDokitContainer,
    deleteDokitContainer,
    listDokitContainers,
    cleanupOldContainers,
    syncWorkspaceToR2,
    syncAllcontainersToR2,
    getFolderContent,
    getFileContent,
    writeFileToContainer,
    startFileSystemWatcher,
    createNode,
    deleteNode,
    renameNode,
};

export default DockerManager;
