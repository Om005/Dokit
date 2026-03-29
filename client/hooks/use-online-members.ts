import { useEffect, useState } from "react";
import * as yjs from "yjs";
import { WebsocketProvider } from "y-websocket";
import env from "@/config/env";

interface ActiveUser {
    name: string;
    color: string;
}

export function useOnlineMembers(projectId: string, userName: string, cursorColor: string) {
    const [projectUsers, setProjectUsers] = useState<ActiveUser[]>([]);

    useEffect(() => {
        if (!projectId || !userName || !cursorColor) return;

        const globalDoc = new yjs.Doc();

        const globalRoomName = `dokit-global-${projectId}`;

        const provider = new WebsocketProvider(
            env.NEXT_PUBLIC_EDITOR_SOCKET_URL!,
            globalRoomName,
            globalDoc
        );

        provider.awareness.setLocalStateField("user", {
            name: userName,
            color: cursorColor,
        });

        const updateGlobalUsers = () => {
            const states = Array.from(provider.awareness.getStates().values());
            const users = states.map((state: any) => state.user).filter(Boolean);

            const uniqueUsers = Array.from(new Map(users.map((u) => [u.name, u])).values());

            setProjectUsers(uniqueUsers);
        };

        provider.awareness.on("change", updateGlobalUsers);
        updateGlobalUsers();

        return () => {
            provider.awareness.off("change", updateGlobalUsers);
            provider.destroy();
            globalDoc.destroy();
        };
    }, [projectId, userName, cursorColor]);

    return projectUsers;
}
