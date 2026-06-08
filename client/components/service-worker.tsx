"use client";

import { useEffect } from "react";

export default function ServiceWorker() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/service-worker.js").catch(console.error);
        }
    }, []);

    return null;
}
