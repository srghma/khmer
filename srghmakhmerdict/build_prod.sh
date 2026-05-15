#!/usr/bin/env bash
set -euo pipefail

export KEYSTORE_FILE="$HOME/.dotfiles/secrets/my-release-key.keystore"
export KEY_ALIAS="mykey"

# read -s -p "Enter keystore password (last): " KEYSTORE_PASSWORD
# echo
export KEYSTORE_PASSWORD="TODO"
export KEY_PASSWORD="$KEYSTORE_PASSWORD"

./update_db_version.sh

tauri android build --target aarch64

adb uninstall com.srghma.srghmakhmerdict >/dev/null 2>&1 || true
adb install src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
