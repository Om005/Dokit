import env from "@/config/env";
import { FileSystemEvent, TreeNode } from "@/types/types";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setCurrProject, setGitStatus, setToolStatus, setWorkspaceStatus } from "@/store/editor";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function useFileTreeSocket(
    projectId: string,
    onNodeCreation: (parentPath: string, newNode: TreeNode) => void,
    onNodeDeletion: (path: string, isDir: boolean) => void,
    onRenameNode: (fromPath: string, toPath: string, isDir: boolean) => void
) {
    const dispatch = useDispatch();
    const router = useRouter();
    const socketRef = useRef<ReturnType<typeof io>>(null);
    const id = useSelector((state: RootState) => state.auth.id);
    const currProject = useSelector((state: RootState) => state.editor.currProject);
    const syncLocks = useRef(new Set<string>());
    useEffect(() => {
        if (!projectId) return;

        socketRef.current = io(env.NEXT_PUBLIC_PROJECT_SOCKET_URL, {
            withCredentials: true,
        });
        const socket = socketRef.current;
        socket.emit("join-project", projectId);

        socket.on("fs-change", async (event: FileSystemEvent) => {
            const { action } = event;
            if (action === "CREATE" || action === "DELETE") {
                const { path, isDir } = event;
                if (!path) return;
                const lastSlashIndex = path.lastIndexOf("/");
                const parentPath = lastSlashIndex === 0 ? "/" : path.substring(0, lastSlashIndex);
                const nodeName = path.substring(lastSlashIndex + 1);
                if (action === "CREATE") {
                    onNodeCreation(parentPath, { name: nodeName, path, isDir });
                } else {
                    onNodeDeletion(path, isDir);
                }
            } else if (action === "RENAME") {
                const { fromPath, toPath, isDir } = event;
                if (!fromPath || !toPath) return;
                if (syncLocks.current.has(`${projectId}-${fromPath}-${toPath}-${isDir}`)) {
                    return;
                }
                syncLocks.current.add(`${projectId}-${fromPath}-${toPath}-${isDir}`);
                onRenameNode(fromPath, toPath, isDir);
                await new Promise((resolve) =>
                    setTimeout(() => {
                        syncLocks.current.delete(`${projectId}-${fromPath}-${toPath}-${isDir}`);
                        resolve(null);
                    }, 1000)
                );
            }
        });
        socket.on(
            "MEMBER_ACCESS_CHANGED",
            async (data: { userId: string; newAccessLevel: string }) => {
                if (data.userId === id) {
                    await dispatch(
                        setCurrProject({ ...currProject, currentUserAccess: data.newAccessLevel })
                    );
                }
            }
        );
        socket.on(
            "workspace-status",
            (data: {
                status:
                    | "installing_tools"
                    | "installing_tool"
                    | "uninstalling_tool"
                    | "ready"
                    | "error";
                message?: string;
                toolName?: string;
            }) => {
                if (!data?.status) return;

                if (
                    (data.status === "installing_tool" || data.status === "uninstalling_tool") &&
                    data.toolName
                ) {
                    dispatch(
                        setToolStatus({
                            toolName: data.toolName,
                            status:
                                data.status === "installing_tool" ? "installing" : "uninstalling",
                        })
                    );
                    return;
                }

                if ((data.status === "ready" || data.status === "error") && data.toolName) {
                    dispatch(setToolStatus({ toolName: data.toolName, status: data.status }));
                    return;
                }

                if (!data.message) return;

                if (
                    data.status === "installing_tools" ||
                    data.status === "ready" ||
                    data.status === "error"
                ) {
                    dispatch(setWorkspaceStatus({ status: data.status, message: data.message }));
                }
            }
        );
        socket.on("MEMBER_REMOVED", async (data: { userId: string }) => {
            if (data.userId === id) {
                await dispatch(setCurrProject(null));
                router.push("/dashboard/projects");
                toast.info("You have been removed from the project by the owner.");
            }
        });

        socket.on("git-status-update", async (data: { gitStatus: Record<string, string> }) => {
            try {
                await dispatch(setGitStatus(data.gitStatus));
            } catch (error) {
                console.error("Error updating git status:", error);
            }
        });

        socket.on("project-closed", async (data: { projectId: string }) => {
            if (data.projectId === projectId) {
                await dispatch(setCurrProject(null));
                router.replace("/dashboard/projects");
                toast.info("The project has been closed.");
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [
        projectId,
        onNodeCreation,
        onNodeDeletion,
        onRenameNode,
        id,
        currProject,
        dispatch,
        router,
    ]);
}

export default useFileTreeSocket;
