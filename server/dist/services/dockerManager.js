"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dockerode_1 = __importDefault(require("dockerode"));
const logger_1 = __importDefault(require("../utils/logger"));
const env_1 = __importDefault(require("../config/env"));
const queueActions_1 = __importDefault(require("../modules/queue/queueActions"));
const prisma_1 = require("../db/prisma");
const stream_1 = require("stream");
const yjsServer_1 = require("../sockets/yjsServer");
const index_1 = require("../index");
const tools_1 = require("../constants/tools");
const docker = new dockerode_1.default();
const NETWORK = "dokit-network";
const syncLocks = new Set();
async function waitForContainerReady(containerId, timeoutMs = 60_000) {
    const container = docker.getContainer(containerId);
    const logStream = (await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        timestamps: false,
    }));
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            logStream.destroy();
            reject(new Error(`Container ${containerId} did not become ready within ${timeoutMs}ms`));
        }, timeoutMs);
        logStream.on("data", (chunk) => {
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
async function createDokitContainer(projectId, stack) {
    const containerProjectId = projectId.replaceAll("-", "");
    const containerName = `dokit-${containerProjectId}`;
    const imageName = `dokit-${stack.toLowerCase()}:latest`;
    const existingContainer = docker.getContainer(containerName);
    try {
        const info = await existingContainer.inspect();
        if (!info.State.Running) {
            await existingContainer.start();
        }
        await startFileSystemWatcher(projectId).catch((err) => {
            logger_1.default.error("Failed to start filesystem watcher:");
            logger_1.default.error(err);
        });
        return { containerId: info.Id, containerName };
    }
    catch (error) {
        if (error.statusCode !== 404) {
            logger_1.default.error(`Error inspecting existing container ${containerName}:`);
            logger_1.default.error(error);
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
                    `R2_ACCESS_KEY_ID=${env_1.default.R2_ACCESS_KEY_ID}`,
                    `R2_SECRET_ACCESS_KEY=${env_1.default.R2_SECRET_ACCESS_KEY}`,
                    `R2_ACCOUNT_ID=${env_1.default.R2_ACCOUNT_ID}`,
                    `R2_BUCKET_NAME=${env_1.default.R2_BUCKET_NAME}`,
                ],
                HostConfig: {
                    NetworkMode: NETWORK,
                    AutoRemove: false,
                    Memory: 512 * 1024 * 1024,
                    MemorySwap: 512 * 1024 * 1024,
                    CpuQuota: 50000,
                    CpuPeriod: 100000,
                    SecurityOpt: ["no-new-privileges"],
                    Tmpfs: { "/tmp": "rw,noexec,nosuid,size=64m" },
                },
            });
            await container.start();
            await waitForContainerReady(container.id);
            await startFileSystemWatcher(projectId).catch((err) => {
                logger_1.default.error("Failed to start filesystem watcher:");
                logger_1.default.error(err);
            });
            restoreTools(container, projectId).catch((err) => {
                logger_1.default.error("Failed to restore environment tools:");
                logger_1.default.error(err);
            });
            return { containerId: container.id, containerName };
        }
        catch (createError) {
            const dockerError = createError;
            if (dockerError.statusCode === 409) {
                const raceContainer = docker.getContainer(containerName);
                const raceInfo = await raceContainer.inspect();
                return { containerId: raceInfo.Id, containerName };
            }
            logger_1.default.error(`Error creating or starting container ${containerName}:`);
            logger_1.default.error(dockerError);
            return { containerId: null, containerName };
        }
    }
}
async function deleteDokitContainer(projectId) {
    const containerProjectId = projectId.replaceAll("-", "");
    const containerName = `dokit-${containerProjectId}`;
    try {
        const container = docker.getContainer(containerName);
        await container.remove({ force: true });
        return true;
    }
    catch (error) {
        const dockerError = error;
        if (dockerError.statusCode === 404)
            return true;
        logger_1.default.error(`Error deleting container ${containerName}:`);
        logger_1.default.error(dockerError);
        throw dockerError;
    }
}
async function listDokitContainers() {
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
    }
    catch (error) {
        logger_1.default.error("Error listing Dokit containers:");
        logger_1.default.error(error);
        return [];
    }
}
async function cleanupOldContainers() {
    try {
        const conainers = await listDokitContainers();
        const now = Date.now();
        const twoHrs = 2 * 60 * 60 * 1000;
        const fifteenMins = 15 * 60 * 1000;
        for (const container of conainers) {
            const projectId = container.name
                .replace("dokit-", "")
                .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
            const existingProject = await prisma_1.prisma.project.findUnique({ where: { id: projectId } });
            if (now - container.created.getTime() > twoHrs ||
                !existingProject ||
                existingProject.lastAccessedAt.getTime() < now - fifteenMins) {
                queueActions_1.default.addContainerCleanupJob(projectId).catch((error) => {
                    logger_1.default.error(`Failed to add cleanup job for container ${container.name}:`);
                    logger_1.default.error(error);
                });
            }
        }
    }
    catch (error) {
        logger_1.default.error("Error cleaning up old Dokit containers:");
        logger_1.default.error(error);
        throw error;
    }
}
async function syncWorkspaceToR2(projectId) {
    try {
        const containerProjectId = projectId.replaceAll("-", "");
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);
        const rcloneArgs = [
            `rclone sync /workspace/ R2:${env_1.default.R2_BUCKET_NAME}/code/${projectId}/`,
            `--create-empty-src-dirs`,
            `--s3-directory-markers`,
            `--s3-no-check-bucket`,
            `--exclude 'node_modules/**'`,
            `--exclude 'dist/**'`,
            `--exclude 'build/**'`,
            `--exclude 'out/**'`,
            `--exclude '.next/**'`,
            `--exclude '.nuxt/**'`,
            `--exclude '.svelte-kit/**'`,
            `--exclude '.angular/**'`,
            `--exclude '.cache/**'`,
            `--exclude 'coverage/**'`,
            `--exclude '__pycache__/**'`,
            `--exclude '*.py[cod]'`,
            `--exclude '*$py.class'`,
            `--exclude 'venv/**'`,
            `--exclude '.venv/**'`,
            `--exclude 'env/**'`,
            `--exclude '.pytest_cache/**'`,
            `--exclude '.tox/**'`,
            `--exclude 'vendor/**'`,
            `--exclude 'target/**'`,
            `--exclude 'bin/**'`,
            `--exclude 'obj/**'`,
            `--exclude '.gradle/**'`,
            `--exclude '*.log'`,
            `--exclude 'npm-debug.log*'`,
            `--exclude 'yarn-error.log*'`,
            `--exclude '.DS_Store'`,
            `--exclude 'Thumbs.db'`,
            `-v`,
        ];
        const rcloneCmd = rcloneArgs.join(" ");
        const exec = await container.exec({
            Cmd: ["bash", "-c", rcloneCmd],
            AttachStdout: true,
            AttachStderr: true,
            User: "dokituser",
            Env: [
                "RCLONE_CONFIG_R2_TYPE=s3",
                "RCLONE_CONFIG_R2_PROVIDER=Cloudflare",
                `RCLONE_CONFIG_R2_ACCESS_KEY_ID=${env_1.default.R2_ACCESS_KEY_ID}`,
                `RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=${env_1.default.R2_SECRET_ACCESS_KEY}`,
                `RCLONE_CONFIG_R2_ENDPOINT=https://${env_1.default.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            ],
        });
        const stream = await exec.start({ hijack: true, stdin: false });
        const stdout = new stream_1.PassThrough();
        const stderr = new stream_1.PassThrough();
        container.modem.demuxStream(stream, stdout, stderr);
        stdout.on("data", (chunk) => logger_1.default.info(`[Rclone]: ${chunk.toString().trim()}`));
        stderr.on("data", (chunk) => logger_1.default.error(`[Rclone Error]: ${chunk.toString().trim()}`));
        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });
        const inspectResult = await exec.inspect();
        if (inspectResult.ExitCode !== 0) {
            logger_1.default.error(`Rclone sync failed for project ${projectId} with exit code ${inspectResult.ExitCode}`);
        }
        else {
            logger_1.default.info(`Rclone sync completed successfully for project ${projectId}`);
        }
    }
    catch (error) {
        logger_1.default.error(`Error syncing workspace to R2 for project ${projectId}:`);
        logger_1.default.error(error);
        throw error;
    }
}
async function syncAllcontainersToR2() {
    try {
        const containers = await listDokitContainers();
        for (const container of containers) {
            const projectId = container.name
                .replace("dokit-", "")
                .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
            queueActions_1.default.addSyncToR2Job(projectId).catch((error) => {
                logger_1.default.error(`Failed to add sync to R2 job for container ${container.name}:`);
                logger_1.default.error(error);
            });
        }
    }
    catch (error) {
        logger_1.default.error("Error syncing all workspaces to R2:");
        logger_1.default.error(error);
        throw error;
    }
}
async function getFolderContent(projectId, folderPath) {
    try {
        const containerProjectId = projectId.replaceAll("-", "");
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);
        const targetPath = folderPath === "/" ? "/workspace" : `/workspace/${folderPath}`;
        const command = `find "${targetPath}" -maxdepth 1 -mindepth 1 -not -name "*.git" -not -name "node_modules" -printf "%y|%f\\n"`;
        const exec = await container.exec({
            Cmd: ["bash", "-c", command],
            AttachStdout: true,
            AttachStderr: true,
            User: "dokituser",
        });
        const stream = await exec.start({ hijack: true, stdin: false });
        let output = "";
        const stdout = new stream_1.PassThrough();
        const stderr = new stream_1.PassThrough();
        container.modem.demuxStream(stream, stdout, stderr);
        stdout.on("data", (chunk) => {
            output += chunk.toString();
        });
        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });
        let nodes = {};
        const lines = output.trim().split("\n");
        for (const line of lines) {
            const [nodeType, name] = line.split("|");
            if (!nodeType || !name)
                continue;
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
    }
    catch (error) {
        logger_1.default.error(`Failed to get folder content for project ${projectId} and path ${folderPath}:`);
        logger_1.default.error(error);
        return null;
    }
}
async function getFileContent(projectId, filePath) {
    try {
        const containerProjectId = projectId.replaceAll("-", "");
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);
        const targetPath = `/workspace/${filePath}`;
        const command = `cat "${targetPath}"`;
        const exec = await container.exec({
            Cmd: ["bash", "-c", command],
            AttachStdout: true,
            AttachStderr: true,
            User: "dokituser",
        });
        const stream = await exec.start({ hijack: true, stdin: false });
        let output = "";
        const stdout = new stream_1.PassThrough();
        const stderr = new stream_1.PassThrough();
        container.modem.demuxStream(stream, stdout, stderr);
        stdout.on("data", (chunk) => {
            output += chunk.toString();
        });
        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });
        return output.replace(/\r/g, "");
    }
    catch (error) {
        logger_1.default.error(`Failed to get file content for project ${projectId} and file ${filePath}:`);
        logger_1.default.error(error);
        return null;
    }
}
async function writeFileToContainer(projectId, filePath, content) {
    try {
        const containerProjectId = projectId.replaceAll("-", "");
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);
        const targetPath = `/workspace/${filePath}`;
        const base64Content = Buffer.from(content).toString("base64");
        const command = `echo "${base64Content}" | base64 -d > "${targetPath}"`;
        const exec = await container.exec({
            Cmd: ["bash", "-c", command],
            AttachStdout: true,
            AttachStderr: true,
            User: "dokituser",
        });
        const stream = await exec.start({ hijack: true, stdin: false });
        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });
    }
    catch (error) {
        logger_1.default.error(`Failed to write file content for project ${projectId} and file ${filePath}:`);
        logger_1.default.error(error);
        throw error;
    }
}
async function startFileSystemWatcher(projectId) {
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
        const command = "inotifywait -m -r -e close_write,create,delete,move --format '%e|%w%f' /workspace";
        const exec = await container.exec({
            Cmd: ["bash", "-c", command],
            AttachStdout: true,
            AttachStderr: true,
            User: "dokituser",
        });
        const stream = await exec.start({ hijack: true, stdin: false });
        const stdout = new stream_1.PassThrough();
        const stderr = new stream_1.PassThrough();
        container.modem.demuxStream(stream, stdout, stderr);
        stdout.on("data", (chunk) => {
            const output = chunk.toString().trim();
            const events = output.split("\n");
            let pendingEvent = null;
            events.forEach(async (event) => {
                const [action, filePath] = event.split("|");
                if (!filePath.startsWith("/workspace/"))
                    return;
                if (excluded.some((ex) => filePath.startsWith(`${ex}/`)))
                    return;
                if (excluded.some((ex) => filePath.includes(`/${ex}`)))
                    return;
                const relativePath = filePath.replace("/workspace", "");
                const isDir = action.includes("ISDIR");
                if (action.includes("CLOSE_WRITE") || action.includes("MODIFY")) {
                    if (!isDir) {
                        (0, yjsServer_1.syncDockerToYjs)(containerProjectId, relativePath).catch((err) => {
                            logger_1.default.error(`Failed to sync changed file ${relativePath} to Yjs for project ${containerProjectId}:`);
                            logger_1.default.error(err);
                        });
                    }
                }
                else if (action.includes("CREATE")) {
                    if (syncLocks.has(`CREATE-${projectId}-${relativePath}-${isDir ? "dir" : "file"}`)) {
                        return;
                    }
                    syncLocks.add(`CREATE-${projectId}-${relativePath}-${isDir ? "dir" : "file"}`);
                    index_1.io.to(projectId).emit("fs-change", {
                        action: "CREATE",
                        path: relativePath,
                        isDir: isDir,
                    });
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            syncLocks.delete(`CREATE-${projectId}-${relativePath}-${isDir ? "dir" : "file"}`);
                            resolve(null);
                        }, 3000);
                    });
                }
                else if (action.includes("DELETE")) {
                    index_1.io.to(projectId).emit("fs-change", {
                        action: "DELETE",
                        path: relativePath,
                        isDir: isDir,
                    });
                }
                else {
                    const [action, path] = event.split("|");
                    if (action.includes("MOVED_FROM")) {
                        pendingEvent = event;
                    }
                    else if (action.includes("MOVED_TO") && pendingEvent) {
                        const [fromAction, fromPath] = pendingEvent.split("|");
                        pendingEvent = null;
                        const fromPathRelative = fromPath.replace("/workspace", "");
                        const isDir = action.includes("ISDIR");
                        const toPathRelative = path.replace("/workspace", "");
                        if (syncLocks.has(`MOVE-${projectId}-${fromPathRelative}-${toPathRelative}-${isDir ? "dir" : "file"}`)) {
                            return;
                        }
                        syncLocks.add(`MOVE-${projectId}-${fromPathRelative}-${toPathRelative}-${isDir ? "dir" : "file"}`);
                        index_1.io.to(projectId).emit("fs-change", {
                            action: "RENAME",
                            fromPath: fromPathRelative,
                            toPath: toPathRelative,
                            isDir: isDir,
                        });
                        await new Promise((resolve) => {
                            setTimeout(() => {
                                syncLocks.delete(`MOVE-${projectId}-${fromPathRelative}-${toPathRelative}-${isDir ? "dir" : "file"}`);
                                resolve(null);
                            }, 3000);
                        });
                    }
                }
            });
            stream.on("end", () => {
                logger_1.default.info(`File system watcher stream ended for project ${containerProjectId}`);
            });
        });
    }
    catch (error) {
        logger_1.default.error(`Failed to start file system watcher for project ${containerProjectId}:`);
        logger_1.default.error(error);
        throw error;
    }
}
async function createNode(projectId, nodePath, isDir) {
    const containerProjectId = projectId.replaceAll("-", "");
    try {
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);
        const cleanNodePath = nodePath.replace(/^\/+/, "");
        const targetPath = `/workspace/${cleanNodePath}`;
        if (targetPath.includes(".."))
            throw new Error("Invalid path: Path traversal detected");
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
            User: "dokituser",
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
    }
    catch (error) {
        logger_1.default.error(`Failed to create node in container for project ${containerProjectId}:`);
        logger_1.default.error(error);
        throw error;
    }
}
async function deleteNode(projectId, nodePath) {
    const containerProjectId = projectId.replaceAll("-", "");
    try {
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);
        const cleanNodePath = nodePath.replace(/^\/+/, "");
        const targetPath = `/workspace/${cleanNodePath}`;
        if (targetPath.includes(".."))
            throw new Error("Invalid path: Path traversal detected");
        if (targetPath === "/workspace" || targetPath === "/workspace/") {
            throw new Error("Invalid operation: Cannot delete the root workspace directory");
        }
        const command = `rm -rf "${targetPath}"`;
        const exec = await container.exec({
            Cmd: ["bash", "-c", command],
            AttachStdout: true,
            AttachStderr: true,
            User: "dokituser",
        });
        const stream = await exec.start({ hijack: true, stdin: false });
        stream.resume();
        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });
        const inspectData = await exec.inspect();
        if (inspectData.ExitCode !== 0) {
            throw new Error(`Failed to delete node: ${cleanNodePath} (Exit Code: ${inspectData.ExitCode})`);
        }
    }
    catch (error) {
        logger_1.default.error(`Failed to delete node in container for project ${containerProjectId}:`);
        logger_1.default.error(error);
        throw error;
    }
}
async function renameNode(projectId, oldPath, newPath) {
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
            User: "dokituser",
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
        }
        else if (inspectData.ExitCode === 2) {
            throw new Error(`Destination name already taken: ${cleanNewPath}`);
        }
        else if (inspectData.ExitCode !== 0) {
            throw new Error(`Failed to rename node (Exit Code: ${inspectData.ExitCode})`);
        }
    }
    catch (error) {
        logger_1.default.error(`Failed to rename node in container for project ${containerProjectId}:`);
        logger_1.default.error(error);
        throw error;
    }
}
async function restoreTools(container, projectId) {
    try {
        index_1.io.to(projectId).emit("workspace-status", {
            status: "installing_tools",
            message: "Restoring environment tools, please wait...",
        });
        const project = await prisma_1.prisma.project.findUnique({
            where: {
                id: projectId,
            },
        });
        const toolKeys = project.tools;
        if (toolKeys.length == 0) {
            index_1.io.to(projectId).emit("workspace-status", {
                status: "ready",
                message: "Workspace is ready",
            });
            return;
        }
        const packagesToInstall = toolKeys
            .map((key) => tools_1.ALLOWED_TOOLS[key])
            .filter(Boolean)
            .join(" ");
        if (!packagesToInstall.trim()) {
            index_1.io.to(projectId).emit("workspace-status", {
                status: "ready",
                message: "Workspace is ready",
            });
            return;
        }
        const installExec = await container.exec({
            Cmd: [
                "sh",
                "-c",
                `apt-get update > /dev/null && apt-get install -y ${packagesToInstall} > /dev/null`,
            ],
            User: "root",
            AttachStdout: true,
            AttachStderr: true,
        });
        const stream = await installExec.start({ hijack: true, stdin: false });
        stream.resume();
        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });
        index_1.io.to(projectId).emit("workspace-status", {
            status: "ready",
            message: "Workspace is ready",
        });
    }
    catch (error) {
        logger_1.default.error(`Failed to restore environment tools for project ${projectId}:`);
        logger_1.default.error(error);
        index_1.io.to(projectId).emit("workspace-status", {
            status: "error",
            message: "Failed to restore environment tools",
        });
        throw error;
    }
}
async function installTool(projectId, toolName) {
    try {
        index_1.io.to(projectId).emit("workspace-status", {
            status: "installing_tool",
            message: `Installing ${toolName}, please wait...`,
            toolName,
        });
        const containerProjectId = projectId.replaceAll("-", "");
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);
        const packageToInstall = tools_1.ALLOWED_TOOLS[toolName];
        if (!packageToInstall) {
            throw new Error(`Invalid or unsupported tool requested.`);
        }
        const exec = await container.exec({
            Cmd: [
                "sh",
                "-c",
                `apt-get update > /dev/null && apt-get install -y ${packageToInstall} > /dev/null`,
            ],
            User: "root",
            AttachStdout: true,
            AttachStderr: true,
        });
        const stream = await exec.start({ hijack: true, stdin: false });
        stream.resume();
        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });
        index_1.io.to(projectId).emit("workspace-status", {
            status: "ready",
            message: `${toolName} installed successfully`,
            toolName,
        });
    }
    catch (error) {
        logger_1.default.error(`Failed to install tool ${toolName} for project ${projectId}:`);
        logger_1.default.error(error);
        index_1.io.to(projectId).emit("workspace-status", {
            status: "error",
            message: `Failed to install tool ${toolName}`,
        });
        throw error;
    }
}
async function uninstallTool(projectId, toolName) {
    try {
        index_1.io.to(projectId).emit("workspace-status", {
            status: "uninstalling_tool",
            message: `Uninstalling ${toolName}, please wait...`,
            toolName,
        });
        const containerProjectId = projectId.replaceAll("-", "");
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);
        const packageToUninstall = tools_1.ALLOWED_TOOLS[toolName];
        if (!packageToUninstall) {
            throw new Error(`Invalid or unsupported tool requested.`);
        }
        const exec = await container.exec({
            Cmd: [
                "sh",
                "-c",
                `apt-get remove -y ${packageToUninstall} > /dev/null && apt-get autoremove -y > /dev/null`,
            ],
            User: "root",
            AttachStdout: true,
            AttachStderr: true,
        });
        const stream = await exec.start({ hijack: true, stdin: false });
        stream.resume();
        await new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });
        index_1.io.to(projectId).emit("workspace-status", {
            status: "ready",
            message: `${toolName} uninstalled successfully`,
            toolName,
        });
    }
    catch (error) {
        logger_1.default.error(`Failed to uninstall tool ${toolName} for project ${projectId}:`);
        logger_1.default.error(error);
        index_1.io.to(projectId).emit("workspace-status", {
            status: "error",
            message: `Failed to uninstall tool ${toolName}`,
        });
        throw error;
    }
}
async function createDokitContainerFromGithub(projectId, repoUrl) {
    const containerProjectId = projectId.replaceAll("-", "");
    const containerName = `dokit-${containerProjectId}`;
    const imageName = `dokit-github:latest`;
    try {
        const container = await docker.createContainer({
            name: containerName,
            Image: imageName,
            Tty: true,
            OpenStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            ExposedPorts: { "7681/tcp": {} },
            Env: [`PROJECT_ID=${projectId}`, `GITHUB_REPO_URL=${repoUrl}`],
            HostConfig: {
                NetworkMode: NETWORK,
                AutoRemove: false,
                Memory: 512 * 1024 * 1024,
                MemorySwap: 512 * 1024 * 1024,
                CpuQuota: 50000,
                CpuPeriod: 100000,
                SecurityOpt: ["no-new-privileges"],
                Tmpfs: { "/tmp": "rw,noexec,nosuid,size=64m" },
            },
        });
        await container.start();
        await waitForContainerReady(container.id);
        await startFileSystemWatcher(projectId).catch((err) => {
            logger_1.default.error("Failed to start filesystem watcher:");
            logger_1.default.error(err);
        });
        return { containerId: container.id, containerName };
    }
    catch (error) {
        logger_1.default.error(`Failed to create container for project ${projectId}:`);
        logger_1.default.error(error);
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
    installTool,
    uninstallTool,
    createDokitContainerFromGithub,
};
exports.default = DockerManager;
