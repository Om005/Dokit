#!/bin/bash
# docker/node/entrypoint.sh
mkdir -p ~/.config/rclone
cat > ~/.config/rclone/rclone.conf << EOF
[r2]
type = s3
provider = Cloudflare
access_key_id = ${R2_ACCESS_KEY_ID}
secret_access_key = ${R2_SECRET_ACCESS_KEY}
endpoint = https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
EOF

echo "Syncing code for project: ${PROJECT_ID}"
rclone copy r2:${R2_BUCKET_NAME}/code/${PROJECT_ID}/ /workspace/ --progress || true

cat > /root/.bashrc << 'BASHRC'
export PS1="\[\033[01;32m\]dokit\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
cd /workspace
BASHRC

exec ttyd -W -t fontSize=14 -p 7681 bash --rcfile /root/.bashrc