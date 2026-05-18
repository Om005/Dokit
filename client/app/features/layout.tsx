import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Features",
};

export default function FeaturesLayout({ children }: { children: ReactNode }) {
    return children;
}
