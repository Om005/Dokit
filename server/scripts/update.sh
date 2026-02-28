#!/bin/bash
set -e

# Default to development if NODE_ENV not set
ENV="${NODE_ENV:-development}"
ENV_FILE=".env.${ENV}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file '$ENV_FILE' not found"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

: "${MAXMIND_LICENSE_KEY:?MAXMIND_LICENSE_KEY not set in $ENV_FILE}"

LICENSE_KEY="$MAXMIND_LICENSE_KEY"
EDITION_ID="GeoLite2-City" # Or "GeoLite2-Country"
DEST_DIR="./geoip"
TMP_FILE="geoip.tar.gz"

DOWNLOAD_URL="https://download.maxmind.com/app/geoip_download?edition_id=${EDITION_ID}&license_key=${LICENSE_KEY}&suffix=tar.gz"

# DOWNLOAD
mkdir -p "$DEST_DIR"

echo "NODE_ENV=$ENV"
echo "Downloading $EDITION_ID..."

curl -fL "$DOWNLOAD_URL" -o "$TMP_FILE"

# VALIDATION
if file "$TMP_FILE" | grep -qi text; then
  echo "Download failed. Response:"
  cat "$TMP_FILE"
  rm -f "$TMP_FILE"
  exit 1
fi

# EXTRACTION
echo "Extracting database..."

tar --strip-components=1 -xzvf "$TMP_FILE" -C "$DEST_DIR" --wildcards "*.mmdb"

# CLEANUP
rm -f "$TMP_FILE"

echo "Done! Database updated in $DEST_DIR"
