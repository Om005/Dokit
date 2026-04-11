#!/bin/bash

mkdir -p /workspace
chown -R dokituser:dokituser /workspace

echo "Init project: ${PROJECT_ID}"
gosu dokituser git clone --depth 1 "${GITHUB_REPO_URL}" /workspace/ || echo "Git clone failed, continuing..."


cat > /home/dokituser/.bashrc << 'BASHRC'
export HISTFILE=/home/dokituser/.bash_history
export HISTSIZE=1000
export HISTFILESIZE=2000

export PIP_PROGRESS_BAR=off


export PS1="\[\033[01;32m\]dokit\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "
export PATH="/home/dokituser/.local/bin:/workspace/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
alias ll='ls -alF'

echo ""
echo "  ──────────────────────────────────"
echo "  Welcome to Dokit"
echo "  ──────────────────────────────────"
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

echo "CONTAINER_READY"

exec gosu dokituser ttyd -W -t fontSize=14 -p 7681 bash --rcfile /home/dokituser/.bashrc