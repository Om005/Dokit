"use client";

import dynamic from "next/dynamic";

const Terminal = dynamic(() => import("@/components/terminal"), { ssr: false });

interface Props {
    wsUrl: string;
}

export default function TerminalLoader({ wsUrl }: Props) {
    return <Terminal wsUrl={wsUrl} />;
}
