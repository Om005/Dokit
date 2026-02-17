import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const NODE_ENV = process.env.NODE_ENV;
const envFile = NODE_ENV === "production" ? ".env.production" : ".env.development";
const PATH = path.resolve(process.cwd(), envFile);

if (fs.existsSync(PATH)) {
    dotenv.config({
        path: PATH,
    });
} else {
    console.error(`Environment file ${envFile} not found`);
    process.exit(1);
}

const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

const TEMPLATES: Record<string, string> = {
    "base/node": path.join(__dirname, "../templates/node"),
    "base/react_vite": path.join(__dirname, "../templates/react_vite"),
    "base/express": path.join(__dirname, "../templates/express"),
};

function getAllFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        return entry.isDirectory() ? getAllFiles(fullPath) : [fullPath];
    });
}

async function uploadTemplate(r2Prefix: string, localDir: string) {
    if (!fs.existsSync(localDir)) {
        console.warn(`Skipping ${r2Prefix} — local folder not found: ${localDir}`);
        return;
    }

    const files = getAllFiles(localDir);
    console.log(`Uploading ${files.length} files for ${r2Prefix}...`);

    for (const filePath of files) {
        const relativePath = path.relative(localDir, filePath);
        const r2Key = `${r2Prefix}/${relativePath.replace(/\\/g, "/")}`;
        const body = fs.readFileSync(filePath);

        await r2.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: r2Key,
                Body: body,
            })
        );
    }
}

async function main() {
    console.log("Starting base template upload...\n");
    for (const [prefix, localDir] of Object.entries(TEMPLATES)) {
        await uploadTemplate(prefix, localDir);
    }
    console.log("\nAll templates uploaded!");
}

main().catch((err) => {
    console.error("Upload failed:", err);
    process.exit(1);
});
