"use client";

import { cn } from "@/lib/utils";

interface LoaderProps {
    className?: string;
}

export function Loader({ className }: LoaderProps) {
    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-background",
                className
            )}
        >
            <div className="text-4xl md:text-6xl font-bold tracking-tighter animate-pulse">
                Dokit.
            </div>
        </div>
    );
}
