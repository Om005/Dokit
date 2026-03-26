import env from "@/config/env";
import { FileSystemEvent, TreeNode } from "@/types/types";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setCurrProject } from "@/store/editor";
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
    const syncLocks = new Set<string>();
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
                if (syncLocks.has(`${projectId}-${fromPath}-${toPath}-${isDir}`)) {
                    return;
                }
                syncLocks.add(`${projectId}-${fromPath}-${toPath}-${isDir}`);
                onRenameNode(fromPath, toPath, isDir);
                await new Promise((resolve) =>
                    setTimeout(() => {
                        syncLocks.delete(`${projectId}-${fromPath}-${toPath}-${isDir}`);
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
        socket.on("MEMBER_REMOVED", async (data: { userId: string }) => {
            if (data.userId === id) {
                await dispatch(setCurrProject(null));
                router.push("/dashboard/projects");
                toast.info("You have been removed from the project by the owner.");
            }
        });
        return () => {
            socket.disconnect();
        };
    }, [projectId]);
}

export default useFileTreeSocket;
