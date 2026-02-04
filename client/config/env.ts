interface EnvConfig {
    NEXT_PUBLIC_BACKEND_URL: string;
}

const env: EnvConfig = {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
};

export default env;
