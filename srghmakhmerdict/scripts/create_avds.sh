#!/usr/bin/env bash

# Names of the AVDs
PHONE_AVD="phone_emulator"
TEN_INCH_AVD="tablet_10_emulator"

# System image to use
SYSTEM_IMAGE="system-images;android-35;google_apis;x86_64"

# Device profiles
PHONE_DEVICE="pixel_5"
TEN_INCH_DEVICE="pixel_tablet"

create_avd() {
    local name=$1
    local device=$2
    echo "Creating AVD: $name with device: $device..."
    echo "no" | avdmanager create avd -n "$name" -k "$SYSTEM_IMAGE" -d "$device" --force
}

# Check if system image is installed
if ! sdkmanager --list_installed | grep -q "$SYSTEM_IMAGE"; then
    echo "Error: System image $SYSTEM_IMAGE is not installed."
    echo "Please install it via sdkmanager or update your flake.nix and run 'nix develop'."
    exit 1
fi

create_avd "$PHONE_AVD" "$PHONE_DEVICE"
create_avd "$TEN_INCH_AVD" "$TEN_INCH_DEVICE"

echo "AVDs created successfully."
echo "You can start them using:"
echo "emulator -avd $PHONE_AVD"
echo "emulator -avd $TEN_INCH_AVD"
