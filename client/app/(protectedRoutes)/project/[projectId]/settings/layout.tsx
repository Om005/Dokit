import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Project Settings",
};

export default function ProjectSettingsLayout({ children }: { children: ReactNode }) {
    return children;
}
