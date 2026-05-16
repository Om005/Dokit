import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

let isRefreshing = false;
type FailedQueueItem = {
    resolve: () => void;
    reject: (error: unknown) => void;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown) => {
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
    async (error: AxiosError) => {
        const originalRequest = error.config as RetriableRequestConfig | undefined;
        const statusCode = (error.response?.data as { statusCode?: number })?.statusCode;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        if (statusCode !== 401) {
            return Promise.reject(error);
        }

        const requestUrl = originalRequest.url || "";

        if (requestUrl.includes("/refresh-session") || requestUrl.includes("/sign-out")) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise<void>((resolve, reject) => {
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
        } catch (refreshError: unknown) {
            processQueue(refreshError);

            // Dynamically import to avoid circular dependency
            const { store } = await import("@/store/store");
            const { clearAuth } = await import("@/store/authentication");

            store.dispatch(clearAuth());

            const refreshMessage =
                (refreshError as AxiosError<{ message?: string }>).response?.data?.message ||
                "Session expired. Please sign in again.";

            toast.error(refreshMessage);

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
