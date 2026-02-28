# docker/node/Dockerfile
FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y \
    git curl wget vim nano bash \
    build-essential \
    unzip \
    && rm -rf /var/lib/apt/lists/*
    
# Install ttyd (WebSocket terminal server)
RUN curl -Lo /usr/local/bin/ttyd \
    https://github.com/tsl0922/ttyd/releases/download/1.7.4/ttyd.x86_64 \
    && chmod +x /usr/local/bin/ttyd

# Install rclone (to sync R2 bucket to local filesystem)
RUN curl https://rclone.org/install.sh | bash

RUN mkdir -p /workspace
WORKDIR /workspace

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 7681
EXPOSE 5173
ENTRYPOINT ["/entrypoint.sh"]