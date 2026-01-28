#!/usr/bin/env bash

set -e

# Paths
TAURI_CONF="src-tauri/tauri.conf.json"
DB_PATH="src-tauri/dict.db"

# 1. Check if files exist
if [ ! -f "$TAURI_CONF" ]; then
    echo "❌ Error: $TAURI_CONF not found."
    exit 1
fi

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Error: $DB_PATH not found. Please create the SQLite DB first."
    exit 1
fi

# 2. Extract version from tauri.conf.json using jq
# We look at .version (standard Tauri v2 config)
APP_VERSION=$(jq -r '.version' "$TAURI_CONF")

if [ "$APP_VERSION" == "null" ] || [ -z "$APP_VERSION" ]; then
    echo "❌ Error: Could not extract version from tauri.conf.json"
    exit 1
fi

echo "ℹ️  Found App Version: $APP_VERSION"

# 3. Create metadata table if it doesn't exist
sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT);"

# 4. Insert or Replace the version
sqlite3 "$DB_PATH" "INSERT OR REPLACE INTO metadata (key, value) VALUES ('version', '$APP_VERSION');"

echo "✅ Successfully updated $DB_PATH metadata with version $APP_VERSION"

# 5. Compress the file (Optional, but usually part of the build flow)
echo "📦 Compressing..."
gzip -c -9 "$DB_PATH" > "src-tauri/dict.dbgz"
echo "✅ Compressed to src-tauri/dict.dbgz"
