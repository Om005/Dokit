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

// async function waitForPort(host: string, port: number, timeoutMs = 30000): Promise<void> {
//     const start = Date.now();
//     while (Date.now() - start < timeoutMs) {
//         try {
//             await new Promise<void>((resolve, reject) => {
//                 const socket = new net.Socket();
//                 socket.setTimeout(1000);
//                 socket.on("connect", () => { socket.destroy(); resolve(); });
//                 socket.on("error", reject);
//                 socket.on("timeout", reject);
//                 socket.connect(port, host);
//             });
//             console.log(`Port ${port} on ${host} is open!`);
//             return;
//         } catch {
//             console.log(`Port ${port} on ${host} not open yet, retrying...`);
//             await new Promise(r => setTimeout(r, 300));
//         }
//     }
//     throw new Error(`Timed out waiting for ${host}:${port}`);
// }

async function waitForContainerReady(
    container: Docker.Container,
    timeoutMs = 30000
): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const exec = await container.exec({
                Cmd: ["sh", "-c", "curl -sf http://localhost:7681"],
                AttachStdout: true,
                AttachStderr: true,
            });
            const stream = await exec.start({ hijack: true, stdin: false });
            await new Promise((r) => stream.on("end", r));
            const inspectResult = await exec.inspect();
            if (inspectResult.ExitCode === 0) {
                console.log("ttyd is ready!");
                return;
            }
        } catch {}
        await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(`Container not ready after ${timeoutMs}ms`);
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
            // const hostPort = containerInfo.NetworkSettings.Ports["7681/tcp"]?.[0]?.HostPort;
            // if (!hostPort) throw new Error("Could not get host port for container");
            // await waitForPort("127.0.0.1", parseInt(hostPort));
            // await waitForContainerReady(existingContainer);
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
                    PortBindings: {
                        "7681/tcp": [{ HostPort: "0" }], // 0 = random available port
                    },
                },
            });

            await container.start();

            const containerInfo = await container.inspect();
            // const hostPort = containerInfo.NetworkSettings.Ports["7681/tcp"]?.[0]?.HostPort;
            // if (!hostPort) throw new Error("Could not get host port for container");
            // await waitForPort("127.0.0.1", parseInt(hostPort));
            // await waitForContainerReady(container);

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
    // const containerProjectId = projectId.replace(/-/g, "").slice(0, 12);
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
            const projectId = container.name.replace("dokit-", "");
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

const DockerManager = {
    createDokitContainer,
    deleteDokitContainer,
    listDokitContainers,
    cleanupOldContainers,
};

export default DockerManager;
