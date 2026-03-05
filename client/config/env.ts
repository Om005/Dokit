interface EnvConfig {
    NEXT_PUBLIC_BACKEND_URL: string;
    NEXT_PUBLIC_EDITOR_SOCKET_URL: string;
    NEXT_PUBLIC_NGINX_HOST: string;
}

const env: EnvConfig = {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
    NEXT_PUBLIC_EDITOR_SOCKET_URL:
        process.env.NEXT_PUBLIC_EDITOR_SOCKET_URL || "ws://localhost:4000",
    NEXT_PUBLIC_NGINX_HOST: process.env.NEXT_PUBLIC_NGINX_HOST || "localhost:8080",
};

export default env;
