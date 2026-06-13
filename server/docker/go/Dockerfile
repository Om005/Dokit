FROM golang:1.24-bookworm

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

RUN mkdir -p /go-warmup && cat > /go-warmup/main.go << 'EOF'
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
)

func writeJSON(w http.ResponseWriter, statusCode int, data map[string]string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    _ = json.NewEncoder(w).Encode(data)
}

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        writeJSON(w, http.StatusOK, map[string]string{
            "status":  "success",
            "message": "Go sandbox is running successfully!",
        })
    })
    http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
        writeJSON(w, http.StatusOK, map[string]string{"status": "healthy"})
    })
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    log.Printf("Server running on :%s", port)
    log.Fatal(http.ListenAndServe(":"+port, nil))
}
EOF

RUN cat > /go-warmup/go.mod << 'EOF'
module warmup
go 1.24
EOF

# Build into /dev/null to populate the Go build cache without keeping the binary
RUN cd /go-warmup \
    && GOCACHE=/go-cache GOMODCACHE=/go/pkg/mod go build -o /dev/null . \
    && rm -rf /go-warmup

# Make the cache world-readable so dokituser can copy it at runtime
RUN chmod -R 755 /go-cache

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
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]