import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Project Workspace",
};

export default function ProjectLayout({ children }: { children: ReactNode }) {
    return children;
}
