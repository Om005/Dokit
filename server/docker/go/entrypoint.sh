#!/bin/bash

# Configure rclone for Cloudflare R2
mkdir -p /home/dokituser/.config/rclone
cat > /home/dokituser/.config/rclone/rclone.conf << EOF
[r2]
type = s3
provider = Cloudflare
access_key_id = ${R2_ACCESS_KEY_ID}
secret_access_key = ${R2_SECRET_ACCESS_KEY}
endpoint = https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
EOF

mkdir -p /workspace
chown -R dokituser:dokituser /workspace

if [ -d /go-cache ] && [ ! -d /home/dokituser/.cache/go-build ]; then
    echo "Restoring pre-warmed Go build cache..."
    mkdir -p /home/dokituser/.cache
    cp -r /go-cache /home/dokituser/.cache/go-build
    chown -R dokituser:dokituser /home/dokituser/.cache
    echo "Go build cache restored."
fi

echo "Syncing Go project: ${PROJECT_ID}"
gosu dokituser rclone copy r2:${R2_BUCKET_NAME}/code/${PROJECT_ID}/ /workspace/ --progress || echo "Sync failed, continuing..."

rm -rf /home/dokituser/.config/rclone/rclone.conf

cat > /home/dokituser/.bashrc << 'BASHRC'
export HISTFILE=/home/dokituser/.bash_history
export HISTSIZE=1000
export HISTFILESIZE=2000

export PS1="\[\033[01;32m\]dokit\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "
export PATH="/home/dokituser/go/bin:/workspace/node_modules/.bin:$PATH"
export TMPDIR=/workspace/.tmp
alias ll='ls -alF'

echo ""
echo "  Welcome to Dokit"
echo "  ──────────────────────────────────"
echo "  Run the following to get started:"
echo ""
echo "    1. go run ."
echo "  ──────────────────────────────────"
echo ""

cd /workspace

cd() {
    local target="${1:-/workspace}"
    local resolved
    resolved=$(realpath -m "${target}" 2>/dev/null || echo "${target}")
    if [[ "${resolved}" != /workspace && "${resolved}" != /workspace/* ]]; then
        echo "Permission denied: access outside /workspace is restricted"
        return 1
    fi
    builtin cd "${resolved}"
}
BASHRC

chown root:root /home/dokituser/.bashrc
chmod 644 /home/dokituser/.bashrc

mkdir -p /workspace/.tmp
chown -R dokituser:dokituser /workspace/.tmp

echo "Go Project ready"
echo "Run: go run ."
echo "CONTAINER_READY"

unset PROJECT_ID
unset R2_ACCESS_KEY_ID
unset R2_SECRET_ACCESS_KEY
unset R2_ACCOUNT_ID
unset R2_BUCKET_NAME

exec gosu dokituser ttyd -W -t fontSize=14 -p 7681 bash --rcfile /home/dokituser/.bashrc