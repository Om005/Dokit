FROM python:3.10-slim-bookworm

RUN apt-get update && apt-get install -y \
    git curl wget vim nano bash inotify-tools \
    build-essential \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install ttyd (WebSocket terminal server)
RUN curl -Lo /usr/local/bin/ttyd \
    https://github.com/tsl0922/ttyd/releases/download/1.7.4/ttyd.x86_64 \
    && chmod +x /usr/local/bin/ttyd

RUN curl -Lo /usr/local/bin/gosu \
    https://github.com/tianon/gosu/releases/download/1.16/gosu-amd64 \
    && chmod +x /usr/local/bin/gosu

# Install rclone (to sync R2 bucket to local filesystem)
RUN curl https://rclone.org/install.sh | bash

# Install Poetry
RUN python -m pip install --no-cache-dir --upgrade pip poetry

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN useradd -m -s /bin/bash -u 1001 dokituser
RUN apt-get purge -y --auto-remove sudo 2>/dev/null || true
RUN chmod 700 /usr/bin/apt \
    && chmod 700 /usr/bin/apt-get \
    && chmod 700 /bin/su \
    && chmod 700 /usr/bin/dpkg \
    && chmod 700 /sbin/systemctl 2>/dev/null || true

RUN chmod 711 /home/dokituser
RUN chmod o-rx /boot /media /mnt /srv /opt

RUN chmod 700 /root

RUN mkdir -p /workspace && chown -R dokituser:dokituser /workspace
WORKDIR /workspace

RUN git config --global --add safe.directory /workspace

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 7681
EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]