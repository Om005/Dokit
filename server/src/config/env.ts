import dotenv from "dotenv";
import path from "path";
import fs from "fs";


const NODE_ENV = process.env.NODE_ENV || "development";
const envFile = NODE_ENV === "production" ? ".env.production" : ".env.development";
const PATH = path.resolve(process.cwd(), envFile);



if(fs.existsSync(PATH)) {
    dotenv.config({ 
        path: PATH 
    });
}
else {
    console.error(`Environment file ${envFile} not found`);
    process.exit(1);
}

interface EnvConfig {
    NODE_ENV: "development" | "production";
    PORT: number;
    FRONTEND_URL: string;
}

const env: EnvConfig = {
    NODE_ENV: NODE_ENV as "development" | "production",
    PORT: parseInt(process.env.PORT as string, 10),
    FRONTEND_URL: process.env.FRONTEND_URL as string
};

export default env;