import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    async rewrites() {
        return [
        {
            source: '/api/:path*',
            destination: 'https://dokit.backends.live/api/:path*',
        },
        ]
    },
    reactStrictMode: false,
};

export default nextConfig;
