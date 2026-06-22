import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { RootState } from "@/store/store";
import { updateProjectStatus } from "@/store/project";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function useDashboardSocket() {
    const dispatch = useDispatch();
    const socketRef = useRef<Socket | null>(null);
    const id = useSelector((state: RootState) => state.auth.id);
    const router = useRouter();

    useEffect(() => {
        if (!id) return;

        socketRef.current = io(process.env.NEXT_PUBLIC_PROJECT_SOCKET_URL as string, {
            withCredentials: true,
        });

        const socket = socketRef.current;

        socket.emit("join-user", id);

        socket.on("project-status-updated", (payload: { projectId: string; status: string }) => {
            dispatch(updateProjectStatus(payload));
            toast.success("Your project is initialized and running!", {
                action: {
                    label: "Open project",
                    onClick: () => {
                        router.push(`/project/${payload.projectId.replaceAll("-", "")}`);
                    },
                },
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [id, dispatch, router]);
}

export default useDashboardSocket;
