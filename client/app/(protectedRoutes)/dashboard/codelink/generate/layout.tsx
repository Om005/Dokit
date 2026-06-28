import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Code Link | Dokit",
};

export default function CodeLinkGenerateLayout({ children }: { children: ReactNode }) {
    return children;
}
