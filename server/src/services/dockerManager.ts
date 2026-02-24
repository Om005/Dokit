import Docker from "dockerode";
import { ProjectStack } from "@generated/prisma";
import logger from "@utils/logger";
import env from "@config/env";

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

async function waitForContainerReady(
    container: Docker.Container,
    timeoutMs = 60000
): Promise<boolean> {
    const startTime = Date.now();

    try {
        while (Date.now() - startTime < timeoutMs) {
            const info = await container.inspect();
            const status = info.State.Status;

            if (status === "exited" || status === "dead") {
                const logsBuffer = await container.logs({ stdout: true, stderr: true });
                logger.error(
                    `Container ${info.Name} exited unexpectedly with status '${status}'. Logs:\n${logsBuffer.toString("utf8").trim()}`
                );
                return false;
            }

            if (status === "running") {
                const logsBuffer = await container.logs({ stdout: true, stderr: true, tail: 50 });
                const logs = logsBuffer.toString("utf8");

                if (logs.includes("Project ready.")) {
                    return true;
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        logger.error(`Container did not become ready within ${timeoutMs / 1000} seconds.`);
        return false;
    } catch (error) {
        logger.error(`Error during waitForContainerReady for container ${container.id}:`);
        logger.error(error);
        return false;
    }
}

async function createDokitContainer(
    projectId: string,
    stack: ProjectStack
): Promise<{ containerId: string | null; containerName: string }> {
    const containerName = `dokit-${projectId}`;
    const imageName = `dokit-${stack.toLowerCase()}:latest`;

    const existingContainer = docker.getContainer(containerName);

    try {
        const info = await existingContainer.inspect();

        if (!info.State.Running) {
            await existingContainer.start();
            await waitForContainerReady(existingContainer);
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
            await waitForContainerReady(container);

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
    const containerName = `dokit-${projectId}`;

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

const DockerManager = {
    createDokitContainer,
    deleteDokitContainer,
    listDokitContainers,
};

export default DockerManager;
