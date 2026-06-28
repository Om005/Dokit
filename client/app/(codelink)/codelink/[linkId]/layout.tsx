"use client";

import { Navbar } from "@/components/navbar";

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <Navbar />
            {children}
        </div>
    );
};

export default layout;
