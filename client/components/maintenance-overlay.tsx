"use client";

import { useEffect, useState } from "react";
import { getMaintenanceMode, subscribeMaintenanceMode } from "@/lib/maintenance-store";

export default function MaintenanceOverlay() {
    const [active, setActive] = useState(getMaintenanceMode);

    useEffect(() => {
        return subscribeMaintenanceMode(setActive);
    }, []);

    useEffect(() => {
        if (!active) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch("/health", { cache: "no-store" });
                if (res.ok) {
                    clearInterval(interval);
                    window.location.reload();
                }
            } catch {
                // keep polling
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [active]);

    if (!active) return null;

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center px-6 text-center"
            style={{
                backgroundColor: "#0a0e1a",
                backgroundImage: `
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
      `,
                backgroundSize: "28px 28px",
            }}
        >
            <div className="w-full max-w-[460px]">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#ffb454]">
                    Dokit
                </div>

                <h1 className="mb-2 text-[26px] font-[650] leading-[1.3] tracking-[-0.01em] text-[#e8eaf2]">
                    We&apos;re deploying something new.
                </h1>

                <p className="mb-7 text-[15px] leading-[1.55] text-[#8b93a7]">
                    This usually takes a couple of minutes. This page checks for you and will
                    refresh the moment we&apos;re back — no need to keep reloading.
                </p>

                <div className="overflow-hidden rounded-[10px] border border-[#232b45] bg-[#11162a] text-left shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
                    <div className="flex items-center gap-2 border-b border-[#232b45] bg-white/[0.015] px-[14px] py-[10px]">
                        <div className="h-[7px] w-[7px] rounded-full bg-[#ffb454]" />
                        <span className="font-mono text-xs text-[#5b6378]">deploy.sh</span>
                    </div>

                    <div className="min-h-[168px] px-[18px] py-4 font-mono text-[13px] leading-[1.9]">
                        <div className="flex gap-2">
                            <span className="w-[14px] shrink-0 text-[#4ade80]">✓</span>
                            <span className="text-[#8b93a7]">Installing dependencies</span>
                        </div>

                        <div className="flex gap-2">
                            <span className="w-[14px] shrink-0 text-[#4ade80]">✓</span>
                            <span className="text-[#8b93a7]">Generating Prisma client</span>
                        </div>

                        <div className="flex gap-2">
                            <span className="w-[14px] shrink-0 text-[#4ade80]">✓</span>
                            <span className="text-[#8b93a7]">Building backend</span>
                        </div>

                        <div className="flex gap-2">
                            <span className="w-[14px] shrink-0 text-[#ffb454]">{">"}</span>
                            <span className="text-[#e8eaf2]">
                                Activating new release
                                <span
                                    className="ml-[2px] inline-block h-[13px] w-[6px] bg-[#ffb454] align-[-2px]"
                                    style={{ animation: "maintenance-cursor 1s step-end infinite" }}
                                />
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 text-[13px] text-[#5b6378]">
                    <div className="h-[6px] w-[6px] animate-pulse rounded-full bg-[#ffb454]" />
                    <span>checking for the moment we&apos;re back…</span>
                </div>
            </div>
        </div>
    );
}
