import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { authActions } from "@/store/authentication";
import { toast } from "sonner";
import { Loader } from "./loader";

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const { isAuthenticated, isAuthLoading } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (!isAuthLoading && isAuthenticated) {
            router.push("/");
        }
    }, [isAuthenticated, isAuthLoading, router]);

    if (isAuthLoading) {
        return <Loader />;
    }

    if (isAuthenticated) {
        return null;
    }

    if (isAuthLoading === false && isAuthenticated === false) {
        return <div>{children}</div>;
    }
};

export default GuestRoute;
