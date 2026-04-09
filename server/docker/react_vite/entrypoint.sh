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

echo "Syncing Vite+React project: ${PROJECT_ID}"
gosu dokituser rclone copy r2:${R2_BUCKET_NAME}/code/${PROJECT_ID}/ /workspace/ --progress || echo "Sync failed, continuing..."

rm -rf /home/dokituser/.config/rclone/rclone.conf


cat > /home/dokituser/.bashrc << 'BASHRC'
export HISTFILE=/home/dokituser/.bash_history
export HISTSIZE=1000
export HISTFILESIZE=2000

export PIP_PROGRESS_BAR=off


export PS1="\[\033[01;32m\]dokit\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "
export PATH="/home/dokituser/.local/bin:/workspace/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
alias ll='ls -alF'

echo ""
echo "  Welcome to Dokit"
echo "  ──────────────────────────────────"
echo "  Run the following to get started:"
echo ""
echo "    1. npm install (if not done yet)"
echo "    2. npm run dev"
echo "  ──────────────────────────────────"
echo ""

cd /workspace

cd() {
    local target="${1:-/workspace}"
    # Resolve to absolute path
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

echo "Vite + React Project ready"
echo "Run: npm run dev"

echo "CONTAINER_READY"

unset PROJECT_ID
unset R2_ACCESS_KEY_ID
unset R2_SECRET_ACCESS_KEY
unset R2_ACCOUNT_ID
unset R2_BUCKET_NAME

exec gosu dokituser ttyd -W -t fontSize=14 -p 7681 bash --rcfile /home/dokituser/.bashrc