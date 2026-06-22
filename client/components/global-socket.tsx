"use client";

import useDashboardSocket from "@/hooks/use-project-status";

export function GlobalSocket() {
    useDashboardSocket();

    return null;
}
