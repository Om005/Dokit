#!/bin/bash
set -e

# Configure rclone for Cloudflare R2
mkdir -p ~/.config/rclone
cat > ~/.config/rclone/rclone.conf << EOF
[r2]
type = s3
provider = Cloudflare
access_key_id = ${R2_ACCESS_KEY_ID}
secret_access_key = ${R2_SECRET_ACCESS_KEY}
endpoint = https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
EOF

echo "Syncing React+Vite project: ${PROJECT_ID}"

# Pull project files from R2
rclone copy r2:${R2_BUCKET_NAME}/code/${PROJECT_ID}/ /workspace/ --progress

cd /workspace

# Validate required files
if [ ! -f "package.json" ]; then
  echo "package.json not found!"
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Project ready."
echo "You can now run: npm run dev"

# Start web terminal
exec ttyd -W -t fontSize=14 -p 7681 bash