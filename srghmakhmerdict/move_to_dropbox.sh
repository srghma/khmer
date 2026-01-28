#!/usr/bin/env bash

# Configuration
# Based on your previous message, the images are currently here:
SOURCE_PATH="./src-tauri/en_Dict_en_km_com_assets_images"
DROPBOX_DIR="/home/srghma/Dropbox"
ZIP_NAME="en_dict_images.zip"

# 1. Check if source exists
if [ ! -d "$SOURCE_PATH" ]; then
  echo "❌ Error: Source folder not found at $SOURCE_PATH"
  exit 1
fi

# 2. Check if Dropbox folder exists
if [ ! -d "$DROPBOX_DIR" ]; then
  echo "❌ Error: Dropbox folder not found at $DROPBOX_DIR"
  exit 1
fi

echo "📦 Zipping folder..."
# -r = recursive, -q = quiet
# We zip the folder itself so it maintains the directory structure inside
zip -r -q "$ZIP_NAME" "$SOURCE_PATH"

echo "🚚 Moving to Dropbox..."
mv "$ZIP_NAME" "$DROPBOX_DIR/"

echo "✅ Done!"
echo "File is ready at: $DROPBOX_DIR/$ZIP_NAME"
