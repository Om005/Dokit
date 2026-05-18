import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Secure Revoke",
};

export default function SecureRevokeLayout({ children }: { children: ReactNode }) {
    return children;
}
