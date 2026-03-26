#!/bin/bash
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

mkdir -p /workspace

echo "Syncing Vite+React project: ${PROJECT_ID}"
rclone copy r2:${R2_BUCKET_NAME}/code/${PROJECT_ID}/ /workspace/ --progress || echo "Sync failed, continuing..."

cd /workspace

if [ -f "package.json" ]; then
  echo "Installing dependencies..."
  npm install || echo "npm install failed, you can run it manually."
fi

cat > /root/.bashrc << 'BASHRC'
export PS1="\[\033[01;32m\]dokit\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
alias ll='ls -alF'
cd /workspace
BASHRC


echo "Vite + React Project ready"
echo "Run: npm run dev"

echo "CONTAINER_READY"

unset PROJECT_ID
unset R2_ACCESS_KEY_ID
unset R2_SECRET_ACCESS_KEY
unset R2_ACCOUNT_ID
unset R2_BUCKET_NAME

exec ttyd -W -t fontSize=14 -p 7681 bash --rcfile /root/.bashrc