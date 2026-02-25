import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Loader } from "./loader";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const { isAuthenticated, isAuthLoading } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push("/signin");
        }
    }, [isAuthenticated, isAuthLoading, router]);

    if (isAuthLoading) {
        return <Loader />;
    }

    if (isAuthLoading === false && isAuthenticated === true) {
        return <div>{children}</div>;
    }
};

export default ProtectedRoute;
