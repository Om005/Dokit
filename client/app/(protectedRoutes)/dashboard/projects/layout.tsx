import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Projects | Dokit",
};

export default function ProjectsLayout({ children }: { children: ReactNode }) {
    return children;
}
