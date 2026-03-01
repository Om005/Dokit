import Docker from "dockerode";
import { ProjectStack } from "@generated/prisma";
import logger from "@utils/logger";
import env from "@config/env";
import queueActions from "@modules/queue/queueActions";
import { prisma } from "@db/prisma";
import net from "net";

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
            const containerInfo = await existingContainer.inspect();
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

            const containerInfo = await container.inspect();

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
        return false;
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
    }
}

async function syncWorkspaceToR2(projectId: string): Promise<void> {
    try {
        const containerProjectId = projectId.replaceAll("-", "");
        const containerName = `dokit-${containerProjectId}`;
        const container = docker.getContainer(containerName);

        const rcloneCmd = `
                rclone sync /workspace/ r2:${env.R2_BUCKET_NAME}/code/${projectId}/ \\
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
    }
}
const DockerManager = {
    createDokitContainer,
    deleteDokitContainer,
    listDokitContainers,
    cleanupOldContainers,
    syncWorkspaceToR2,
    syncAllcontainersToR2,
};

export default DockerManager;
