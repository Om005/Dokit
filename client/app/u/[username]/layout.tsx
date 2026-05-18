import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata({
    params,
}: {
    params: { username: string };
}): Promise<Metadata> {
    const username = params.username?.trim();

    return {
        title: username ? `${username} Profile` : "Profile",
    };
}

export default function ProfileLayout({ children }: { children: ReactNode }) {
    return children;
}
