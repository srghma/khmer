#!/usr/bin/env bash
set -euo pipefail

# cd to directory where this script is located
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

export KEYSTORE_FILE="$HOME/.dotfiles/secrets/my-release-key.keystore"
export KEY_ALIAS="mykey"

# read -s -p "Enter keystore password (last): " KEYSTORE_PASSWORD
# echo
export KEYSTORE_PASSWORD="${KEYSTORE_PASSWORD:-}"
export KEY_PASSWORD="$KEYSTORE_PASSWORD"

# ./update_db_version.sh

tauri android build --target aarch64

### adb uninstall com.srghma.srghmakhmerdict # >/dev/null 2>&1 ## # || true

# -r is for reinstall. Will make sure that app is not uninstalled. Just additional safety option. To not reset state of app.
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
