"use client";

import GuestRoute from "@/components/guest-route";
import { Navbar } from "@/components/navbar";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <GuestRoute>
                <Navbar />
                {children}
            </GuestRoute>
        </div>
    );
};

export default layout;
