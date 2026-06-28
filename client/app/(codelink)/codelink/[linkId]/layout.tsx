import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import React from "react";

export const metadata: Metadata = {
    title: "Code Link | Dokit",
};

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <Navbar />
            {children}
        </div>
    );
};

export default layout;
