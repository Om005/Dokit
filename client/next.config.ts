import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "https://dokit.backends.live/api/:path*",
            },
            {
                source: "/health",
                destination: "https://dokit.backends.live/health",
            },
        ];
    },
    reactStrictMode: false,
};

export default nextConfig;
