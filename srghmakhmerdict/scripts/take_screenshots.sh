#!/usr/bin/env bash

# Configuration
LOCAL_IMAGES_DIR="fastlane/metadata/android/ru-RU/images"
PHYSICAL_DEVICE_SERIAL="R52M80A1GLH" # User's physical Galaxy S6 (set as 7inch)
PHONE_EMULATOR_NAME="pixel34"
TEN_INCH_EMULATOR_NAME="PixelTablet34"

# To get serials of running emulators/devices, use 'adb devices'
# Emulators typically look like 'emulator-5554'

print_usage() {
    echo "Usage: ./scripts/take_screenshots.sh [type] [name]"
    echo "Types: phone, 7inch (physical), 10inch"
    echo "Example: ./scripts/take_screenshots.sh phone main_screen"
}

TYPE=$1
NAME=$2

if [[ -z "$TYPE" || -z "$NAME" ]]; then
    print_usage
    exit 1
fi

case $TYPE in
    phone)
        TARGET_DIR="$LOCAL_IMAGES_DIR/phoneScreenshots"
        # We try to find an emulator serial
        DEVICE_SERIAL=$(adb devices | grep "emulator" | head -n 1 | cut -f 1)
        if [[ -z "$DEVICE_SERIAL" ]]; then
            echo "Error: No phone emulator found via adb. Please start it first."
            exit 1
        fi
        ;;
    7inch)
        TARGET_DIR="$LOCAL_IMAGES_DIR/sevenInchScreenshots"
        DEVICE_SERIAL="$PHYSICAL_DEVICE_SERIAL"
        ;;
    10inch)
        TARGET_DIR="$LOCAL_IMAGES_DIR/tenInchScreenshots"
        # Since we use the same emulator prefix, if only one is running it might be wrong.
        # User should specify which one is which if multiple are running.
        # For simplicity, we'll try to find the second emulator if it exists, or the first.
        DEVICE_SERIAL=$(adb devices | grep "emulator" | tail -n 2 | cut -f 1)
        if [[ -z "$DEVICE_SERIAL" ]]; then
            echo "Error: No 10inch emulator found via adb. Please start it first."
            exit 1
        fi
        ;;
    *)
        echo "Invalid type: $TYPE"
        print_usage
        exit 1
        ;;
esac

mkdir -p "$TARGET_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${NAME}_${TIMESTAMP}.png"
REMOTE_PATH="/sdcard/${FILENAME}"
LOCAL_PATH="${TARGET_DIR}/${FILENAME}"

echo "Taking screenshot on device $DEVICE_SERIAL..."
adb -s "$DEVICE_SERIAL" shell screencap -p "$REMOTE_PATH"

echo "Pulling screenshot to $LOCAL_PATH..."
adb -s "$DEVICE_SERIAL" pull "$REMOTE_PATH" "$LOCAL_PATH"

echo "Cleaning up remote file..."
adb -s "$DEVICE_SERIAL" shell rm "$REMOTE_PATH"

echo "Done! Saved to $LOCAL_PATH"
