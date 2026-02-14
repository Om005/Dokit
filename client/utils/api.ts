import axios from "axios";
import { store } from "@/store/store";
import { authActions } from "@/store/authentication";
import { toast } from "sonner";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const statusCode = error?.response?.data?.statusCode;

        if (statusCode !== 401) {
            return Promise.reject(error);
        }

        const requestUrl = originalRequest?.url || "";

        if (requestUrl.includes("/refresh-session") || requestUrl.includes("/sign-out")) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then(() => api(originalRequest))
                .catch((err) => Promise.reject(err));
        }

        isRefreshing = true;

        try {
            await api.post("/api/auth/refresh-session");

            processQueue(null);

            return api(originalRequest);
        } catch (refreshError: any) {
            processQueue(refreshError);

            console.log();
            store.dispatch(authActions.signOut());

            toast.error(
                refreshError?.response?.data?.message || "Session expired. Please sign in again."
            );

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
